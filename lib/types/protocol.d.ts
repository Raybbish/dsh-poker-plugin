/**
 * Wire protocol between the browser client and the host gateway.
 *
 * Client → server commands are validated server-side with zod. Server →
 * client views are built PER CONNECTION: a player's snapshot contains their
 * own hole cards and never anyone else's (see `buildTableView`).
 */
import { z } from "zod";
import { ActionType, Card, LegalAction, LogEntry, Pot, RevealInfo, TableState, WinnerInfo } from "./engine/types.js";
import { PokerEngine } from "./engine/engine.js";
export declare const clientMessageSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"joinLobby">;
    requestId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"createTable">;
    requestId: z.ZodString;
    name: z.ZodString;
    maxSeats: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"joinTable">;
    requestId: z.ZodString;
    tableId: z.ZodString;
    nickname: z.ZodString;
    buyIn: z.ZodNumber;
    playerId: z.ZodOptional<z.ZodString>;
    token: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"addBot">;
    requestId: z.ZodString;
    tableId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"configureBotApi">;
    requestId: z.ZodString;
    apiKey: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"deleteTable">;
    requestId: z.ZodString;
    tableId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"leaveTable">;
    requestId: z.ZodString;
    tableId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"action">;
    commandId: z.ZodString;
    playerId: z.ZodString;
    tableId: z.ZodString;
    expectedVersion: z.ZodNumber;
    action: z.ZodEnum<{
        check: "check";
        fold: "fold";
        call: "call";
        bet: "bet";
        raise: "raise";
        allin: "allin";
    }>;
    amount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"resume">;
    requestId: z.ZodString;
    playerId: z.ZodString;
    token: z.ZodString;
    tableId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"requestSnapshot">;
    requestId: z.ZodString;
    tableId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"ping">;
    t: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>], "type">;
export type ClientMessage = z.infer<typeof clientMessageSchema>;
export interface LobbyTableView {
    tableId: string;
    name: string;
    maxSeats: number;
    playerCount: number;
    status: "idle" | "playing" | "paused";
    smallBlind: number;
    bigBlind: number;
    buyIn: number;
    createdAt: number;
}
export interface SeatView {
    seat: number;
    playerId: string;
    nickname: string;
    stack: number;
    bet: number;
    folded: boolean;
    allIn: boolean;
    connected: boolean;
    isBot: boolean;
    isDealer: boolean;
    isSmallBlind: boolean;
    isBigBlind: boolean;
    isTurn: boolean;
    isMe: boolean;
    excluded: boolean;
    /** Only ever present for the viewer's own seat. */
    holeCards?: Card[];
    lastAction?: {
        type: ActionType;
        amount: number;
    } | null;
}
export interface TableView {
    tableId: string;
    name: string;
    version: number;
    handNumber: number;
    maxSeats: number;
    smallBlind: number;
    bigBlind: number;
    buyIn: number;
    /** 'idle' when no hand is running. */
    phase: "idle" | "preflop" | "flop" | "turn" | "river" | "showdown";
    dealerSeat: number;
    seats: SeatView[];
    /** Public board (only present when dealt). */
    community: Card[];
    pots: Pot[];
    toCall: number;
    minRaise: number;
    currentTurnSeat: number;
    actionDeadlineAt: number;
    mySeat: number | null;
    /** The viewer's own hole cards (null when not in a hand / not seated). */
    myHoleCards: Card[] | null;
    myLegalActions: LegalAction[];
    log: LogEntry[];
    reveal: RevealInfo[];
    winners: WinnerInfo[];
    startedAt: number;
}
export interface ServerWelcome {
    type: "welcome";
    serverTime: number;
}
export interface ServerPong {
    type: "pong";
    t: number;
}
export interface ServerLobby {
    type: "lobby";
    tables: LobbyTableView[];
}
export interface ServerJoined {
    type: "joined";
    requestId: string;
    playerId: string;
    token: string;
    tableId: string;
    seat: number;
    stack: number;
    wallet: number;
}
export interface ServerSnapshot {
    type: "snapshot";
    table: TableView;
}
export interface ServerWallet {
    type: "wallet";
    balance: number;
}
export interface ServerBotConfiguration {
    type: "botConfiguration";
    requestId?: string;
    configured: boolean;
    /** True only for a same-origin browser connected over loopback. */
    configurable: boolean;
}
export interface ServerTableDeleted {
    type: "tableDeleted";
    tableId: string;
}
export interface ServerError {
    type: "error";
    requestId?: string;
    code: string;
    message: string;
}
export type ServerMessage = ServerWelcome | ServerPong | ServerLobby | ServerJoined | ServerSnapshot | ServerWallet | ServerBotConfiguration | ServerTableDeleted | ServerError;
export interface LobbySource {
    tableId: string;
    name: string;
    maxSeats: number;
    smallBlind: number;
    bigBlind: number;
    buyIn: number;
    createdAt: number;
    /** Seated players. */
    players: {
        playerId: string;
    }[];
    hasHand: boolean;
    hasConnectedHuman: boolean;
}
export declare function buildLobbyView(source: LobbySource): LobbyTableView;
/**
 * Build the snapshot for ONE viewer. The viewer's own hole cards are included;
 * every other player's hole cards are never present. Deck, tokens and
 * applied-command history are never present.
 */
export declare function buildTableView(state: TableState, viewerPlayerId: string, engine: PokerEngine): TableView;
