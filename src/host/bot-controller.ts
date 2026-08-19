/** DeepSeek-backed poker bots. Model calls stay server-side; the engine remains authoritative. */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { ActionType, Card, LegalAction } from "../engine/types.js";
import type { TableView } from "../protocol.js";
import { TableService, type JoinResult } from "./table-service.js";

export interface BotDecision {
  action: ActionType;
  amount?: number;
}

export interface BotDecisionProvider {
  decide(view: TableView): Promise<BotDecision>;
}

/** Hot-swappable, memory-only provider used by the local configuration flow. */
export class ConfigurableBotDecisionProvider implements BotDecisionProvider {
  #provider: BotDecisionProvider | undefined;
  readonly #createProvider: (apiKey: string) => BotDecisionProvider;

  constructor(createProvider: (apiKey: string) => BotDecisionProvider) {
    this.#createProvider = createProvider;
  }

  get configured(): boolean {
    return this.#provider !== undefined;
  }

  configure(apiKey: string): void {
    this.#provider = this.#createProvider(apiKey);
  }

  async decide(view: TableView): Promise<BotDecision> {
    if (this.#provider === undefined) throw new Error("AI provider is not configured");
    return this.#provider.decide(view);
  }
}

interface BotHttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

type BotFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal },
) => Promise<BotHttpResponse>;

export interface DeepSeekDecisionProviderOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  fetcher?: BotFetch;
}

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
});

const decisionSchema = z.object({
  action: z.enum(["fold", "check", "call", "bet", "raise", "allin"]),
  amount: z.number().int().optional(),
});

function cardLabel(card: Card): string {
  const rank = card.rank <= 10 ? String(card.rank) : ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Record<number, string>)[card.rank] ?? "?";
  return `${rank}${"♣♦♥♠"[card.suit] ?? "?"}`;
}

/** OpenAI-compatible DeepSeek adapter with strict JSON output and a hard timeout. */
export class DeepSeekDecisionProvider implements BotDecisionProvider {
  readonly #apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fetcher: BotFetch;

  constructor(options: DeepSeekDecisionProviderOptions) {
    if (options.apiKey.trim() === "") throw new Error("DeepSeek API key is required");
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

  async decide(view: TableView): Promise<BotDecision> {
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
          content:
            'You are a concise Texas Hold\'em poker bot. Choose exactly one action from legalActions. Return JSON only, shaped as {"action":"fold|check|call|bet|raise|allin","amount":integer}. For bet or raise, amount is the total bet level and must be within min/max. Never invent cards or actions.',
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
    if (!response.ok) throw new Error(`DeepSeek request failed (${response.status})`);
    const completion = completionSchema.parse(await response.json());
    const content = completion.choices[0]?.message.content;
    if (content === null || content === undefined || content.trim() === "") throw new Error("DeepSeek returned an empty decision");
    return decisionSchema.parse(JSON.parse(content));
  }
}

function withAmount(action: LegalAction, requested?: number): BotDecision {
  if (action.type !== "bet" && action.type !== "raise") return { action: action.type };
  const min = action.min ?? 1;
  const max = action.max ?? min;
  const amount = Math.max(min, Math.min(max, Math.round(requested ?? min)));
  return { action: action.type, amount };
}

/** Validate a model proposal against the current engine-produced legal set. */
export function chooseBotAction(view: TableView, proposed?: BotDecision): BotDecision {
  const legal = view.myLegalActions;
  if (proposed !== undefined) {
    const proposedLegal = legal.find((action) => action.type === proposed.action);
    if (proposedLegal !== undefined) return withAmount(proposedLegal, proposed.amount);
  }
  const fallback =
    legal.find((action) => action.type === "check") ??
    legal.find((action) => action.type === "call") ??
    legal.find((action) => action.type === "fold") ??
    legal.find((action) => action.type === "allin") ??
    legal.find((action) => action.type === "bet") ??
    legal.find((action) => action.type === "raise");
  if (fallback === undefined) throw new Error("bot has no legal action");
  return withAmount(fallback);
}

export interface BotControllerOptions {
  decisionDelayMs?: number;
  schedule?: (callback: () => void, delayMs: number) => () => void;
  logger?: { warn(message: string): void };
}

/** Watches table changes and turns each AI seat into one validated engine command. */
export class BotController {
  private readonly delayMs: number;
  private readonly scheduleCallback: (callback: () => void, delayMs: number) => () => void;
  private readonly logger: { warn(message: string): void };
  private readonly pending = new Map<string, () => void>();
  private readonly inFlight = new Set<string>();
  private unsubscribe?: () => void;
  private disposed = false;

  constructor(
    private readonly service: TableService,
    private readonly provider: BotDecisionProvider,
    options: BotControllerOptions = {},
  ) {
    this.delayMs = options.decisionDelayMs ?? 650;
    this.scheduleCallback = options.schedule ?? ((callback, delayMs) => {
      const timer = setTimeout(callback, delayMs);
      return () => clearTimeout(timer);
    });
    this.logger = options.logger ?? console;
  }

  start(): void {
    if (this.unsubscribe !== undefined) return;
    this.disposed = false;
    this.unsubscribe = this.service.onChanged((tableId) => this.schedule(tableId));
    for (const tableId of this.service.tableIds()) this.schedule(tableId);
  }

  addBot(tableId: string, requestedByPlayerId: string): Promise<JoinResult> {
    return this.service.addBot(tableId, requestedByPlayerId);
  }

  dispose(): void {
    this.disposed = true;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    for (const cancel of this.pending.values()) cancel();
    this.pending.clear();
  }

  private schedule(tableId: string): void {
    if (this.disposed || this.pending.has(tableId)) return;
    const cancel = this.scheduleCallback(() => {
      this.pending.delete(tableId);
      void this.playIfBotTurn(tableId);
    }, this.delayMs);
    this.pending.set(tableId, cancel);
  }

  private async playIfBotTurn(tableId: string): Promise<void> {
    const state = this.service.getState(tableId);
    const hand = state?.hand;
    if (state === undefined || hand === null || hand === undefined || !this.service.hasConnectedHuman(tableId)) return;
    const seat = state.seats[hand.currentTurnSeat];
    if (seat === null || seat === undefined || seat.isBot !== true || this.inFlight.has(seat.playerId)) return;

    const view = this.service.snapshotFor(tableId, seat.playerId);
    if (view.myLegalActions.length === 0) return;
    this.inFlight.add(seat.playerId);
    let proposed: BotDecision | undefined;
    try {
      proposed = await this.provider.decide(view);
    } catch (error) {
      this.logger.warn(`poker bot: AI decision failed; using safe fallback (${error instanceof Error ? error.message : "unknown error"})`);
    }

    try {
      const latest = this.service.getState(tableId);
      if (latest?.hand === null || latest?.hand === undefined || latest.version !== view.version || !this.service.hasConnectedHuman(tableId)) return;
      const latestSeat = latest.seats[latest.hand.currentTurnSeat];
      if (latestSeat?.playerId !== seat.playerId) return;
      const action = chooseBotAction(view, proposed);
      await this.service.action(seat.playerId, tableId, `bot-${view.version}-${randomUUID().slice(0, 8)}`, view.version, action.action, action.amount);
    } catch (error) {
      this.logger.warn(`poker bot: action was not applied (${error instanceof Error ? error.message : "unknown error"})`);
    } finally {
      this.inFlight.delete(seat.playerId);
      this.schedule(tableId);
    }
  }
}
