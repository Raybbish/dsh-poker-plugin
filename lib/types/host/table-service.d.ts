import { Context } from "@deepseek-ai/cordis";
import { PokerEngine } from "../engine/engine.js";
import type { Rng } from "../engine/cards.js";
import { ActionType, TableState } from "../engine/types.js";
import { Ledger, walletDelta } from "../ledger.js";
import { LobbyTableView, TableView } from "../protocol.js";
import { pokerDomainSpec } from "./persistence.js";
import type { Domain } from "@deepseek-ai/dsh-storage-domain";
export declare class TableError extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export interface JoinResult {
    playerId: string;
    token: string;
    seat: number;
    stack: number;
    wallet: number;
    tableId: string;
}
/** Durable identity record: playerId → issued token (never client-settable). */
export interface PlayerRecord {
    playerId: string;
    token: string;
    nickname: string;
    createdAt: number;
}
export interface ServiceConfig {
    smallBlind: number;
    bigBlind: number;
    buyIn: number;
    maxSeats: number;
    actionTimeoutMs: number;
    startingWallet: number;
}
export declare function resolveServiceConfig(raw: Partial<ServiceConfig> | undefined): ServiceConfig;
export interface TableServiceOptions {
    /** Injectable clock (tests); defaults to Date.now. */
    now?: () => number;
    /** Injectable server-side shuffle source for deterministic simulations. */
    rng?: Rng;
}
export declare class TableService {
    private readonly ctx;
    private readonly domain;
    readonly engine: PokerEngine;
    readonly ledger: Ledger;
    readonly config: ServiceConfig;
    readonly now: () => number;
    private readonly tables;
    private readonly turnTimers;
    private readonly listeners;
    /** Durable identity registry — the authoritative token store. */
    private readonly players;
    private tail;
    constructor(ctx: Context, domain: Domain<typeof pokerDomainSpec>, config?: Partial<ServiceConfig>, options?: TableServiceOptions);
    /** Load persisted tables, ledger and identities; humans disconnect, bots stay attached. */
    init(): Promise<void>;
    /** Serialize every service operation (mutation + durability + broadcast). */
    private enqueue;
    lobbyView(): LobbyTableView[];
    walletOf(playerId: string): number;
    /** Whether a non-bot seat is currently present and connected at the table. */
    hasConnectedHuman(tableId: string): boolean;
    snapshotFor(tableId: string, playerId: string): TableView;
    tableIds(): string[];
    getState(tableId: string): TableState | undefined;
    createTable(name: string, maxSeats: number): Promise<TableState>;
    /**
     * Seat a player. When `existingPlayerId` + `existingToken` are supplied and
     * valid, the same wallet/identity is reused; otherwise a new player is
     * created and granted `startingWallet` Play Tokens (idempotent grant).
     */
    joinTable(tableId: string, nickname: string, buyIn: number, existingPlayerId?: string, existingToken?: string): Promise<JoinResult>;
    /** Add one server-controlled player. Only a seated human may request it. */
    addBot(tableId: string, requestedByPlayerId: string, nickname?: string): Promise<JoinResult>;
    /** Fold (mid-hand) or immediately remove (no hand); cash out at hand end or now. */
    leaveTable(playerId: string, tableId: string): Promise<void>;
    /**
     * Cancel and remove a room. Each seat receives exactly the chips it owns at
     * this instant, including chips already committed to an unfinished hand.
     * A persisted tombstone plus stable ledger ids makes crash recovery
     * idempotent: restart completes missing refunds before deleting the record.
     */
    deleteTable(tableId: string): Promise<void>;
    /** Apply one player action command with version fencing + commandId dedup. */
    action(playerId: string, tableId: string, commandId: string, expectedVersion: number, type: ActionType, amount?: number): Promise<{
        applied: boolean;
    }>;
    /** Reattach a socket identity. Returns true when the token matches a seat. */
    resume(playerId: string, token: string, tableId: string): Promise<boolean>;
    /** Socket lifecycle: mark connected/disconnected. */
    setConnected(playerId: string, tableId: string, connected: boolean): Promise<void>;
    private requireTable;
    private tableHasConnectedHuman;
    /** True only when every human seat has explicitly requested to leave. */
    private tableIsDeliberatelyAbandoned;
    /** Register a brand-new player: grant + durable identity record (both awaited). */
    private registerPlayer;
    private grant;
    private debitBuyIn;
    private cashOutSeat;
    private chipsOwnedAtCancellation;
    private finalizeTableDeletion;
    /** Append one entry and WAIT for durability (crash-consistency: no entry is
     *  acknowledged before it is on disk). Idempotent on duplicate transactionId. */
    private recordLedger;
    private persistTable;
    /**
     * Record engine events into the public log. The engine already writes every
     * `log`-kind event into `state.log` itself (its `logEvent`), so the service
     * only appends the structural events (showdown / hand-end) that carry no
     * log line of their own — otherwise every action would be recorded twice.
     */
    private recordEvents;
    private emit;
    onChanged(listener: (tableId: string) => void): () => void;
    private isCommandApplied;
    private markCommandApplied;
    /** Finish an AI-only hand after the last human deliberately leaves. */
    private settleAbandonedHand;
    /**
     * React to engine changes: write hand-result ledger entries, free leaving /
     * disconnected seats, start the next hand, re-arm the turn timer.
     */
    private afterEngineChange;
    /** Start the next hand when ≥2 players and at least one human are connected. */
    private maybeStartHand;
    /** Arm the turn-deadline timer for the current hand, if any. */
    private armTurnTimer;
    private onTurnTimeout;
    /** Total chips in the whole system (wallets + table escrow) — conservation. */
    totalSystemChips(): number;
    dispose(): void;
}
export { walletDelta };
