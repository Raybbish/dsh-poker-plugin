/**
 * TableService — the authoritative game backend.
 *
 * Owns tables, wallets (via the Ledger), join/leave, command validation
 * (commandId dedup + expectedVersion fencing), turn timers, disconnect rules
 * and persistence. Transport-agnostic: the WebSocket gateway is a thin
 * adapter over `onChanged` + the command methods, so tests drive the service
 * directly with fake connections.
 */
import { randomBytes, randomUUID } from "node:crypto";
import { PokerEngine } from "../engine/engine.js";
import { DEFAULT_TABLE_CONFIG, MAX_PLAYERS, MIN_PLAYERS, STARTING_WALLET, } from "../engine/types.js";
import { Ledger, walletDelta } from "../ledger.js";
import { buildLobbyView, buildTableView } from "../protocol.js";
export class TableError extends Error {
    code;
    constructor(message, code = "table-error") {
        super(message);
        this.code = code;
        this.name = "TableError";
    }
}
export function resolveServiceConfig(raw) {
    return {
        smallBlind: raw?.smallBlind ?? DEFAULT_TABLE_CONFIG.smallBlind,
        bigBlind: raw?.bigBlind ?? DEFAULT_TABLE_CONFIG.bigBlind,
        buyIn: raw?.buyIn ?? DEFAULT_TABLE_CONFIG.buyIn,
        maxSeats: Math.min(Math.max(raw?.maxSeats ?? DEFAULT_TABLE_CONFIG.maxSeats, MIN_PLAYERS), MAX_PLAYERS),
        actionTimeoutMs: raw?.actionTimeoutMs ?? DEFAULT_TABLE_CONFIG.actionTimeoutMs,
        startingWallet: raw?.startingWallet ?? STARTING_WALLET,
    };
}
const COMMAND_HISTORY_LIMIT = 256;
export class TableService {
    ctx;
    domain;
    engine;
    ledger = new Ledger();
    config;
    now;
    tables = new Map();
    turnTimers = new Map();
    listeners = new Set();
    /** Durable identity registry — the authoritative token store. */
    players = new Map();
    tail = Promise.resolve();
    constructor(ctx, domain, config, options = {}) {
        this.ctx = ctx;
        this.domain = domain;
        this.config = resolveServiceConfig(config);
        this.now = options.now ?? Date.now;
        this.engine = new PokerEngine({ now: this.now });
    }
    // ── lifecycle ─────────────────────────────────────────────────────────────
    /** Load persisted tables, ledger and identities; humans disconnect, bots stay attached. */
    async init() {
        const tableTable = this.domain.table("tables");
        const ledgerTable = this.domain.table("ledger");
        const playersTable = this.domain.table("players");
        this.ledger.rebuild([...ledgerTable.entries()].map(([, entry]) => entry));
        for (const [playerId, record] of playersTable.entries()) {
            this.players.set(playerId, record);
        }
        for (const [tableId, state] of tableTable.entries()) {
            for (const seat of state.seats) {
                if (seat !== null && seat !== undefined) {
                    seat.connected = seat.isBot === true;
                    seat.leaving = false;
                    // Reconcile seats written before the registry existed (or by older
                    // versions) so identity verification stays authoritative.
                    if (!this.players.has(seat.playerId)) {
                        const record = {
                            playerId: seat.playerId,
                            token: seat.token,
                            nickname: seat.nickname,
                            createdAt: seat.joinedAt,
                        };
                        this.players.set(seat.playerId, record);
                        await playersTable.put(seat.playerId, record);
                    }
                }
            }
            state.handNumber = state.handNumber ?? 0;
            this.tables.set(tableId, state);
            if (state.hand !== null)
                this.armTurnTimer(state);
        }
    }
    /** Serialize every service operation (mutation + durability + broadcast). */
    enqueue(op) {
        const run = this.tail.then(op, op);
        this.tail = run.then(() => undefined, () => undefined);
        return run;
    }
    // ── lobby / wallet ────────────────────────────────────────────────────────
    lobbyView() {
        return [...this.tables.values()]
            .map((state) => buildLobbyView({
            tableId: state.tableId,
            name: state.name,
            maxSeats: state.maxSeats,
            smallBlind: state.smallBlind,
            bigBlind: state.bigBlind,
            buyIn: state.buyIn,
            createdAt: state.createdAt,
            players: state.seats.filter((s) => s !== null && s !== undefined),
            hasHand: state.hand !== null,
        }))
            .sort((a, b) => a.createdAt - b.createdAt);
    }
    walletOf(playerId) {
        return this.ledger.balanceOf(playerId);
    }
    /** Whether a non-bot seat is currently present and connected at the table. */
    hasConnectedHuman(tableId) {
        const state = this.tables.get(tableId);
        return state !== undefined && this.tableHasConnectedHuman(state);
    }
    snapshotFor(tableId, playerId) {
        const state = this.requireTable(tableId);
        return buildTableView(state, playerId, this.engine);
    }
    tableIds() {
        return [...this.tables.keys()];
    }
    getState(tableId) {
        return this.tables.get(tableId);
    }
    // ── mutations ─────────────────────────────────────────────────────────────
    createTable(name, maxSeats) {
        return this.enqueue(async () => {
            const max = Math.min(Math.max(maxSeats, MIN_PLAYERS), MAX_PLAYERS);
            const now = this.now();
            const state = {
                tableId: randomUUID(),
                name,
                maxSeats: max,
                smallBlind: this.config.smallBlind,
                bigBlind: this.config.bigBlind,
                buyIn: this.config.buyIn,
                version: 0,
                createdAt: now,
                seats: new Array(max).fill(null),
                dealerSeat: -1,
                hand: null,
                handNumber: 0,
                log: [{ at: now, text: `Table "${name}" created (blinds ${this.config.smallBlind}/${this.config.bigBlind}, buy-in ${this.config.buyIn}).` }],
                appliedCommands: {},
                actionTimeoutMs: this.config.actionTimeoutMs,
                lastShowdown: null,
            };
            this.tables.set(state.tableId, state);
            await this.persistTable(state);
            this.emit(state.tableId);
            return state;
        });
    }
    /**
     * Seat a player. When `existingPlayerId` + `existingToken` are supplied and
     * valid, the same wallet/identity is reused; otherwise a new player is
     * created and granted `startingWallet` Play Tokens (idempotent grant).
     */
    joinTable(tableId, nickname, buyIn, existingPlayerId, existingToken) {
        return this.enqueue(async () => {
            const state = this.requireTable(tableId);
            const occupied = state.seats.filter((s) => s !== null && s !== undefined);
            if (occupied.length >= state.maxSeats)
                throw new TableError("table is full", "table-full");
            if (buyIn < 1)
                throw new TableError("buy-in must be positive", "bad-buyin");
            if (buyIn > 1_000_000)
                throw new TableError("buy-in too large", "bad-buyin");
            let playerId;
            let token;
            let wallet;
            if (existingPlayerId !== undefined && existingToken !== undefined) {
                const existing = occupied.find((s) => s.playerId === existingPlayerId);
                if (existing !== undefined && existing.token !== existingToken) {
                    throw new TableError("identity token mismatch", "unauthorized");
                }
                if (existing !== undefined)
                    throw new TableError("already seated at this table", "already-seated");
                // The token is authoritative ONLY through the durable registry: a
                // playerId is public (visible in every snapshot), so a missing or
                // mismatched registry token proves the caller is not the owner.
                const record = this.players.get(existingPlayerId);
                if (record === undefined || record.token !== existingToken) {
                    throw new TableError("identity token mismatch", "unauthorized");
                }
                playerId = existingPlayerId;
                token = record.token;
                wallet = this.ledger.balanceOf(playerId);
                if (wallet === 0 && !this.ledger.has(`grant-${playerId}`)) {
                    // Defensive: a registered player always has a grant; re-issue if a
                    // legacy record lacks one.
                    await this.grant(playerId);
                    wallet = this.ledger.balanceOf(playerId);
                }
            }
            else {
                playerId = randomUUID();
                token = randomBytes(24).toString("hex");
                await this.registerPlayer(playerId, token, nickname);
                wallet = this.ledger.balanceOf(playerId);
            }
            if (wallet < buyIn)
                throw new TableError(`wallet too low: ${wallet} < ${buyIn}`, "insufficient-funds");
            const seatIndex = state.seats.findIndex((s) => s === null || s === undefined);
            if (seatIndex < 0)
                throw new TableError("table is full", "table-full");
            const seat = {
                playerId,
                nickname,
                token,
                stack: buyIn,
                connected: false,
                joinedAt: this.now(),
            };
            state.seats[seatIndex] = seat;
            await this.debitBuyIn(playerId, tableId, buyIn);
            state.version += 1;
            state.log.push({
                at: this.now(),
                text: `${nickname} joined at seat ${seatIndex + 1} (buy-in ${buyIn}).`,
            });
            if (state.log.length > 100)
                state.log.splice(0, state.log.length - 100);
            await this.persistTable(state);
            this.emit(state.tableId);
            return { playerId, token, seat: seatIndex, stack: buyIn, wallet: this.ledger.balanceOf(playerId), tableId };
        });
    }
    /** Add one server-controlled player. Only a seated human may request it. */
    addBot(tableId, requestedByPlayerId, nickname) {
        return this.enqueue(async () => {
            const state = this.requireTable(tableId);
            const requester = state.seats.find((seat) => seat?.playerId === requestedByPlayerId);
            if (requester === undefined || requester === null || requester.isBot === true) {
                throw new TableError("only a seated player can add a bot", "unauthorized");
            }
            const occupied = state.seats.filter((seat) => seat !== null && seat !== undefined);
            if (occupied.length >= state.maxSeats)
                throw new TableError("table is full", "table-full");
            // Pick the display name inside the serialized table operation. This keeps
            // names unique even when the client clicks "add AI" several times before
            // the preceding table snapshot has arrived.
            const botCount = occupied.filter((seat) => seat.isBot === true).length;
            const botNickname = nickname ?? (botCount === 0 ? "AI Player" : `AI Player ${botCount + 1}`);
            const playerId = randomUUID();
            const token = randomBytes(24).toString("hex");
            const buyIn = state.buyIn;
            await this.registerPlayer(playerId, token, botNickname);
            if (this.ledger.balanceOf(playerId) < buyIn)
                throw new TableError("bot wallet too low", "insufficient-funds");
            const seatIndex = state.seats.findIndex((seat) => seat === null || seat === undefined);
            if (seatIndex < 0)
                throw new TableError("table is full", "table-full");
            const seat = {
                playerId,
                nickname: botNickname,
                token,
                stack: buyIn,
                connected: true,
                isBot: true,
                joinedAt: this.now(),
            };
            state.seats[seatIndex] = seat;
            await this.debitBuyIn(playerId, tableId, buyIn);
            state.version += 1;
            state.log.push({ at: this.now(), text: `${botNickname} joined at seat ${seatIndex + 1} (AI, buy-in ${buyIn}).` });
            if (state.log.length > 100)
                state.log.splice(0, state.log.length - 100);
            await this.persistTable(state);
            this.emit(state.tableId);
            this.maybeStartHand(state);
            return { playerId, token, seat: seatIndex, stack: buyIn, wallet: this.ledger.balanceOf(playerId), tableId };
        });
    }
    /** Fold (mid-hand) or immediately remove (no hand); cash out at hand end or now. */
    leaveTable(playerId, tableId) {
        return this.enqueue(async () => {
            const state = this.requireTable(tableId);
            const idx = state.seats.findIndex((s) => s?.playerId === playerId);
            if (idx < 0)
                throw new TableError("not seated at this table", "not-seated");
            const seat = state.seats[idx];
            if (state.hand !== null && !seat.leaving) {
                // Mid-hand: fold now, cash out when the hand ends.
                seat.leaving = true;
                const outcome = this.engine.removePlayer(state, playerId, "left the table");
                this.recordEvents(state, outcome.events);
                state.version += 1;
                await this.persistTable(state);
                this.emit(state.tableId);
                await this.afterEngineChange(state, outcome.events);
                return;
            }
            if (!seat.leaving) {
                await this.cashOutSeat(state, idx);
            }
        });
    }
    /** Apply one player action command with version fencing + commandId dedup. */
    action(playerId, tableId, commandId, expectedVersion, type, amount) {
        return this.enqueue(async () => {
            const state = this.requireTable(tableId);
            const idx = state.seats.findIndex((s) => s?.playerId === playerId);
            if (idx < 0)
                throw new TableError("not seated at this table", "not-seated");
            if (state.seats[idx].leaving)
                throw new TableError("player is leaving", "leaving");
            if (this.isCommandApplied(state, playerId, commandId)) {
                // Idempotent replay (client retry after a dropped ack): no state change.
                return { applied: false };
            }
            if (expectedVersion !== state.version) {
                throw new TableError(`stale command: expected version ${expectedVersion}, current ${state.version}`, "stale-version");
            }
            if (state.hand === null)
                throw new TableError("no hand in progress", "no-hand");
            this.markCommandApplied(state, playerId, commandId);
            const outcome = this.engine.applyAction(state, idx, type, amount);
            this.recordEvents(state, outcome.events);
            state.version += 1;
            await this.persistTable(state);
            this.emit(state.tableId);
            await this.afterEngineChange(state, outcome.events);
            return { applied: true };
        });
    }
    /** Reattach a socket identity. Returns true when the token matches a seat. */
    resume(playerId, token, tableId) {
        return this.enqueue(async () => {
            const state = this.tables.get(tableId);
            if (state === undefined)
                return false;
            const seat = state.seats.find((s) => s?.playerId === playerId);
            if (seat === undefined || seat === null || seat.token !== token)
                return false;
            seat.connected = true;
            seat.leaving = false;
            state.version += 1;
            await this.persistTable(state);
            this.emit(state.tableId);
            this.maybeStartHand(state);
            if (state.hand !== null)
                this.armTurnTimer(state);
            return true;
        });
    }
    /** Socket lifecycle: mark connected/disconnected. */
    setConnected(playerId, tableId, connected) {
        return this.enqueue(async () => {
            const state = this.tables.get(tableId);
            if (state === undefined)
                return;
            const seat = state.seats.find((s) => s?.playerId === playerId);
            if (seat === undefined || seat === null)
                return;
            if (seat.connected === connected)
                return;
            seat.connected = connected;
            state.version += 1;
            await this.persistTable(state);
            this.emit(state.tableId);
            if (connected)
                this.maybeStartHand(state);
            if (state.hand !== null)
                this.armTurnTimer(state);
        });
    }
    // ── internals ─────────────────────────────────────────────────────────────
    requireTable(tableId) {
        const state = this.tables.get(tableId);
        if (state === undefined)
            throw new TableError("table not found", "table-not-found");
        return state;
    }
    tableHasConnectedHuman(state) {
        return state.seats.some((seat) => seat !== null && seat !== undefined && seat.isBot !== true && seat.connected && !seat.leaving);
    }
    /** Register a brand-new player: grant + durable identity record (both awaited). */
    async registerPlayer(playerId, token, nickname) {
        await this.grant(playerId);
        const record = { playerId, token, nickname, createdAt: this.now() };
        this.players.set(playerId, record);
        await this.domain.table("players").put(playerId, record);
    }
    async grant(playerId) {
        const entry = {
            transactionId: `grant-${playerId}`,
            playerId,
            tableId: null,
            handId: null,
            amount: this.config.startingWallet,
            reason: "grant",
            createdAt: this.now(),
        };
        await this.recordLedger(entry);
    }
    async debitBuyIn(playerId, tableId, amount) {
        const entry = {
            transactionId: `buyin-${tableId}-${playerId}-${this.now()}-${randomUUID().slice(0, 8)}`,
            playerId,
            tableId,
            handId: null,
            amount: -amount,
            reason: "buy-in",
            createdAt: this.now(),
        };
        await this.recordLedger(entry);
    }
    async cashOutSeat(state, seatIndex) {
        const seat = state.seats[seatIndex];
        if (seat === null || seat === undefined)
            return;
        const amount = seat.stack;
        const entry = {
            transactionId: `cashout-${state.tableId}-${seat.playerId}-${this.now()}-${randomUUID().slice(0, 8)}`,
            playerId: seat.playerId,
            tableId: state.tableId,
            handId: null,
            amount,
            reason: "cash-out",
            createdAt: this.now(),
        };
        await this.recordLedger(entry);
        state.seats[seatIndex] = null;
        state.version += 1;
        state.log.push({ at: this.now(), text: `${seat.nickname} left the table (cashed out ${amount}).` });
        await this.persistTable(state);
        this.emit(state.tableId);
    }
    /** Append one entry and WAIT for durability (crash-consistency: no entry is
     *  acknowledged before it is on disk). Idempotent on duplicate transactionId. */
    async recordLedger(entry) {
        if (!this.ledger.add(entry))
            return;
        await this.domain.table("ledger").put(entry.transactionId, entry);
    }
    async persistTable(state) {
        await this.domain.table("tables").put(state.tableId, state);
    }
    /**
     * Record engine events into the public log. The engine already writes every
     * `log`-kind event into `state.log` itself (its `logEvent`), so the service
     * only appends the structural events (showdown / hand-end) that carry no
     * log line of their own — otherwise every action would be recorded twice.
     */
    recordEvents(state, events) {
        for (const event of events) {
            if (event.kind === "log")
                continue; // already recorded by the engine
            state.log.push({ at: event.at, text: event.text, ...(event.handId ? { handId: event.handId } : {}) });
        }
        if (state.log.length > 100)
            state.log.splice(0, state.log.length - 100);
    }
    emit(tableId) {
        for (const listener of [...this.listeners]) {
            try {
                listener(tableId);
            }
            catch (err) {
                this.ctx.logger.error(`poker: listener error: ${err}`);
            }
        }
    }
    onChanged(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    isCommandApplied(state, playerId, commandId) {
        return (state.appliedCommands[playerId] ?? []).includes(commandId);
    }
    markCommandApplied(state, playerId, commandId) {
        const list = state.appliedCommands[playerId] ?? [];
        list.push(commandId);
        if (list.length > COMMAND_HISTORY_LIMIT)
            list.splice(0, list.length - COMMAND_HISTORY_LIMIT);
        state.appliedCommands[playerId] = list;
    }
    /**
     * React to engine changes: write hand-result ledger entries, free leaving /
     * disconnected seats, start the next hand, re-arm the turn timer.
     */
    afterEngineChange(state, events) {
        const handEnd = events.find((e) => e.kind === "hand-end");
        if (handEnd !== undefined && handEnd.results !== undefined) {
            // Free seats of players who left or stayed disconnected through the end
            // (cash-out happens BEFORE any next hand starts). Hand-result audit
            // entries are written first and awaited (durability before visibility).
            return (async () => {
                for (const result of handEnd.results ?? []) {
                    const entry = {
                        transactionId: `hand-${handEnd.handId}-${result.playerId}`,
                        playerId: result.playerId,
                        tableId: state.tableId,
                        handId: handEnd.handId ?? null,
                        amount: result.stackAfter - result.stackBefore,
                        reason: "hand-result",
                        createdAt: this.now(),
                    };
                    await this.recordLedger(entry);
                }
                for (let i = 0; i < state.seats.length; i++) {
                    const seat = state.seats[i];
                    if (seat !== null && seat !== undefined && (seat.leaving || !seat.connected)) {
                        await this.cashOutSeat(state, i);
                    }
                }
                this.maybeStartHand(state);
                this.armTurnTimer(state);
            })();
        }
        this.maybeStartHand(state);
        this.armTurnTimer(state);
        return Promise.resolve();
    }
    /** Start the next hand when ≥2 players and at least one human are connected. */
    maybeStartHand(state) {
        if (state.hand !== null)
            return;
        if (!this.tableHasConnectedHuman(state))
            return;
        const connected = state.seats.filter((s) => s !== null && s !== undefined && s.connected);
        if (connected.length < MIN_PLAYERS)
            return;
        const outcome = this.engine.startHand(state);
        if (!outcome.changed)
            return;
        this.recordEvents(state, outcome.events);
        state.version += 1;
        void this.persistTable(state);
        this.emit(state.tableId);
        this.armTurnTimer(state);
    }
    /** Arm the turn-deadline timer for the current hand, if any. */
    armTurnTimer(state) {
        const existing = this.turnTimers.get(state.tableId);
        if (existing !== undefined) {
            existing();
            this.turnTimers.delete(state.tableId);
        }
        // An AI-only table is frozen in place: no deadline auto-actions and no API
        // work. Reconnecting or joining a human re-arms this timer.
        if (!this.tableHasConnectedHuman(state))
            return;
        const hand = state.hand;
        if (hand === null)
            return;
        if (hand.turnDeadlineAt === 0)
            return;
        // Already-past deadlines auto-act on the next tick, through the normal path.
        const delay = Math.max(0, hand.turnDeadlineAt - this.now());
        const disposer = this.ctx.timer.timeout(() => {
            this.turnTimers.delete(state.tableId);
            void this.onTurnTimeout(state.tableId);
        }, delay);
        this.turnTimers.set(state.tableId, disposer);
    }
    onTurnTimeout(tableId) {
        return this.enqueue(async () => {
            const state = this.tables.get(tableId);
            if (state === undefined)
                return;
            if (!this.tableHasConnectedHuman(state))
                return;
            const hand = state.hand;
            if (hand === null)
                return;
            const outcome = this.engine.autoAct(state, this.now());
            if (!outcome.changed)
                return;
            this.recordEvents(state, outcome.events);
            state.version += 1;
            await this.persistTable(state);
            this.emit(state.tableId);
            await this.afterEngineChange(state, outcome.events);
            if (state.hand !== null)
                this.armTurnTimer(state);
        });
    }
    /** Total chips in the whole system (wallets + table escrow) — conservation. */
    totalSystemChips() {
        let total = 0;
        for (const entry of this.ledger.all())
            total += walletDelta(entry);
        for (const state of this.tables.values()) {
            total += this.engine.totalChips(state);
        }
        return total;
    }
    dispose() {
        for (const disposer of this.turnTimers.values())
            disposer();
        this.turnTimers.clear();
        this.listeners.clear();
    }
}
export { walletDelta };
//# sourceMappingURL=table-service.js.map