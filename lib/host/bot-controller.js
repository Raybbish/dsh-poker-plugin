/** DeepSeek-backed poker bots. Model calls stay server-side; the engine remains authoritative. */
import { randomUUID } from "node:crypto";
import { z } from "zod";
/** Hot-swappable, memory-only provider used by the local configuration flow. */
export class ConfigurableBotDecisionProvider {
    #provider;
    #createProvider;
    constructor(createProvider) {
        this.#createProvider = createProvider;
    }
    get configured() {
        return this.#provider !== undefined;
    }
    configure(apiKey) {
        this.#provider = this.#createProvider(apiKey);
    }
    async decide(view) {
        if (this.#provider === undefined)
            throw new Error("AI provider is not configured");
        return this.#provider.decide(view);
    }
}
const completionSchema = z.object({
    choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});
const decisionSchema = z.object({
    action: z.enum(["fold", "check", "call", "bet", "raise", "allin"]),
    amount: z.number().int().optional(),
});
function cardLabel(card) {
    const rank = card.rank <= 10 ? String(card.rank) : { 11: "J", 12: "Q", 13: "K", 14: "A" }[card.rank] ?? "?";
    return `${rank}${"♣♦♥♠"[card.suit] ?? "?"}`;
}
/** OpenAI-compatible DeepSeek adapter with strict JSON output and a hard timeout. */
export class DeepSeekDecisionProvider {
    #apiKey;
    baseUrl;
    model;
    timeoutMs;
    fetcher;
    constructor(options) {
        if (options.apiKey.trim() === "")
            throw new Error("DeepSeek API key is required");
        this.#apiKey = options.apiKey.trim();
        this.baseUrl = (options.baseUrl ?? "https://api.deepseek.com").replace(/\/+$/, "");
        this.model = options.model ?? "deepseek-v4-flash";
        this.timeoutMs = options.timeoutMs ?? 12_000;
        this.fetcher =
            options.fetcher ??
                (async (url, init) => {
                    const response = await fetch(url, init);
                    return response;
                });
    }
    async decide(view) {
        const me = view.mySeat === null ? undefined : view.seats.find((seat) => seat.seat === view.mySeat);
        const visibleState = {
            phase: view.phase,
            handNumber: view.handNumber,
            holeCards: (view.myHoleCards ?? []).map(cardLabel),
            communityCards: view.community.map(cardLabel),
            pot: view.pots.reduce((sum, pot) => sum + pot.amount, 0),
            toCall: view.toCall,
            minRaise: view.minRaise,
            myStack: me?.stack ?? 0,
            opponents: view.seats
                .filter((seat) => seat.playerId !== "" && !seat.isMe)
                .map((seat) => ({ nickname: seat.nickname, stack: seat.stack, bet: seat.bet, folded: seat.folded, allIn: seat.allIn, lastAction: seat.lastAction ?? null })),
            legalActions: view.myLegalActions,
            recentPublicLog: view.log.slice(-10).map((entry) => entry.text),
        };
        const body = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: 'You are a concise Texas Hold\'em poker bot. Choose exactly one action from legalActions. Return JSON only, shaped as {"action":"fold|check|call|bet|raise|allin","amount":integer}. For bet or raise, amount is the total bet level and must be within min/max. Never invent cards or actions.',
                },
                { role: "user", content: `Choose the best legal move from this JSON game state:\n${JSON.stringify(visibleState)}` },
            ],
            response_format: { type: "json_object" },
            thinking: { type: "disabled" },
            temperature: 0.35,
            max_tokens: 80,
        };
        const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.#apiKey}` },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok)
            throw new Error(`DeepSeek request failed (${response.status})`);
        const completion = completionSchema.parse(await response.json());
        const content = completion.choices[0]?.message.content;
        if (content === null || content === undefined || content.trim() === "")
            throw new Error("DeepSeek returned an empty decision");
        return decisionSchema.parse(JSON.parse(content));
    }
}
function withAmount(action, requested) {
    if (action.type !== "bet" && action.type !== "raise")
        return { action: action.type };
    const min = action.min ?? 1;
    const max = action.max ?? min;
    const amount = Math.max(min, Math.min(max, Math.round(requested ?? min)));
    return { action: action.type, amount };
}
/** Validate a model proposal against the current engine-produced legal set. */
export function chooseBotAction(view, proposed) {
    const legal = view.myLegalActions;
    if (proposed !== undefined) {
        const proposedLegal = legal.find((action) => action.type === proposed.action);
        if (proposedLegal !== undefined)
            return withAmount(proposedLegal, proposed.amount);
    }
    const fallback = legal.find((action) => action.type === "check") ??
        legal.find((action) => action.type === "call") ??
        legal.find((action) => action.type === "fold") ??
        legal.find((action) => action.type === "allin") ??
        legal.find((action) => action.type === "bet") ??
        legal.find((action) => action.type === "raise");
    if (fallback === undefined)
        throw new Error("bot has no legal action");
    return withAmount(fallback);
}
/** Watches table changes and turns each AI seat into one validated engine command. */
export class BotController {
    service;
    provider;
    delayMs;
    scheduleCallback;
    logger;
    pending = new Map();
    inFlight = new Set();
    unsubscribe;
    disposed = false;
    constructor(service, provider, options = {}) {
        this.service = service;
        this.provider = provider;
        this.delayMs = options.decisionDelayMs ?? 650;
        this.scheduleCallback = options.schedule ?? ((callback, delayMs) => {
            const timer = setTimeout(callback, delayMs);
            return () => clearTimeout(timer);
        });
        this.logger = options.logger ?? console;
    }
    start() {
        if (this.unsubscribe !== undefined)
            return;
        this.disposed = false;
        this.unsubscribe = this.service.onChanged((tableId) => this.schedule(tableId));
        for (const tableId of this.service.tableIds())
            this.schedule(tableId);
    }
    addBot(tableId, requestedByPlayerId) {
        return this.service.addBot(tableId, requestedByPlayerId);
    }
    dispose() {
        this.disposed = true;
        this.unsubscribe?.();
        this.unsubscribe = undefined;
        for (const cancel of this.pending.values())
            cancel();
        this.pending.clear();
    }
    schedule(tableId) {
        if (this.disposed || this.pending.has(tableId))
            return;
        const cancel = this.scheduleCallback(() => {
            this.pending.delete(tableId);
            void this.playIfBotTurn(tableId);
        }, this.delayMs);
        this.pending.set(tableId, cancel);
    }
    async playIfBotTurn(tableId) {
        const state = this.service.getState(tableId);
        const hand = state?.hand;
        if (state === undefined || hand === null || hand === undefined || !this.service.hasConnectedHuman(tableId))
            return;
        const seat = state.seats[hand.currentTurnSeat];
        if (seat === null || seat === undefined || seat.isBot !== true || this.inFlight.has(seat.playerId))
            return;
        const view = this.service.snapshotFor(tableId, seat.playerId);
        if (view.myLegalActions.length === 0)
            return;
        this.inFlight.add(seat.playerId);
        let proposed;
        try {
            proposed = await this.provider.decide(view);
        }
        catch (error) {
            this.logger.warn(`poker bot: AI decision failed; using safe fallback (${error instanceof Error ? error.message : "unknown error"})`);
        }
        try {
            const latest = this.service.getState(tableId);
            if (latest?.hand === null || latest?.hand === undefined || latest.version !== view.version || !this.service.hasConnectedHuman(tableId))
                return;
            const latestSeat = latest.seats[latest.hand.currentTurnSeat];
            if (latestSeat?.playerId !== seat.playerId)
                return;
            const action = chooseBotAction(view, proposed);
            await this.service.action(seat.playerId, tableId, `bot-${view.version}-${randomUUID().slice(0, 8)}`, view.version, action.action, action.amount);
        }
        catch (error) {
            this.logger.warn(`poker bot: action was not applied (${error instanceof Error ? error.message : "unknown error"})`);
        }
        finally {
            this.inFlight.delete(seat.playerId);
            this.schedule(tableId);
        }
    }
}
//# sourceMappingURL=bot-controller.js.map