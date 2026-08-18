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

// ── client → server ─────────────────────────────────────────────────────────

export const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("joinLobby"),
    requestId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("createTable"),
    requestId: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(40),
    maxSeats: z.number().int().min(2).max(10),
  }),
  z.object({
    type: z.literal("joinTable"),
    requestId: z.string().min(1).max(64),
    tableId: z.string().min(1).max(64),
    nickname: z.string().trim().min(1).max(20),
    buyIn: z.number().int().min(1).max(1_000_000),
    /** Optional existing identity (playerId + token) to reuse the same wallet. */
    playerId: z.string().min(1).max(64).optional(),
    token: z.string().min(1).max(128).optional(),
  }),
  z.object({
    type: z.literal("addBot"),
    requestId: z.string().min(1).max(64),
    tableId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("leaveTable"),
    requestId: z.string().min(1).max(64),
    tableId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("action"),
    commandId: z.string().min(1).max(64),
    playerId: z.string().min(1).max(64),
    tableId: z.string().min(1).max(64),
    expectedVersion: z.number().int(),
    action: z.enum(["fold", "check", "call", "bet", "raise", "allin"]),
    amount: z.number().int().optional(),
  }),
  z.object({
    type: z.literal("resume"),
    requestId: z.string().min(1).max(64),
    playerId: z.string().min(1).max(64),
    token: z.string().min(1).max(128),
    tableId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("requestSnapshot"),
    requestId: z.string().min(1).max(64),
    tableId: z.string().min(1).max(64),
  }),
  z.object({
    type: z.literal("ping"),
    t: z.number().optional(),
  }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

// ── server → client ─────────────────────────────────────────────────────────

export interface LobbyTableView {
  tableId: string;
  name: string;
  maxSeats: number;
  playerCount: number;
  status: "idle" | "playing";
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
  lastAction?: { type: ActionType; amount: number } | null;
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

export interface ServerError {
  type: "error";
  requestId?: string;
  code: string;
  message: string;
}

export type ServerMessage =
  | ServerWelcome
  | ServerPong
  | ServerLobby
  | ServerJoined
  | ServerSnapshot
  | ServerWallet
  | ServerError;

// ── per-connection view building ────────────────────────────────────────────

export interface LobbySource {
  tableId: string;
  name: string;
  maxSeats: number;
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
  createdAt: number;
  /** Seated players. */
  players: { playerId: string }[];
  hasHand: boolean;
}

export function buildLobbyView(source: LobbySource): LobbyTableView {
  return {
    tableId: source.tableId,
    name: source.name,
    maxSeats: source.maxSeats,
    playerCount: source.players.length,
    status: source.hasHand ? "playing" : "idle",
    smallBlind: source.smallBlind,
    bigBlind: source.bigBlind,
    buyIn: source.buyIn,
    createdAt: source.createdAt,
  };
}

/**
 * Build the snapshot for ONE viewer. The viewer's own hole cards are included;
 * every other player's hole cards are never present. Deck, tokens and
 * applied-command history are never present.
 */
export function buildTableView(state: TableState, viewerPlayerId: string, engine: PokerEngine): TableView {
  const hand = state.hand;
  const mySeat = state.seats.findIndex((s) => s?.playerId === viewerPlayerId);
  const viewerInHand = hand !== null && hand.players.some((p) => p.playerId === viewerPlayerId && !p.excluded);
  const community: Card[] = hand?.community ?? [];
  const seats: SeatView[] = [];
  const sbSeat = hand !== null ? dealerNext(state, state.dealerSeat, 1) : -1;
  const bbSeat = hand !== null ? dealerNext(state, state.dealerSeat, 2) : -1;

  for (let i = 0; i < state.maxSeats; i++) {
    const seat = state.seats[i];
    if (seat === null || seat === undefined) {
      seats.push({
        seat: i,
        playerId: "",
        nickname: "",
        stack: 0,
        bet: 0,
        folded: false,
        allIn: false,
        connected: false,
        isBot: false,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        isTurn: false,
        isMe: false,
        excluded: true,
      });
      continue;
    }
    const hp = hand?.players.find((p) => p.playerId === seat.playerId);
    const stack = hp !== undefined ? hp.stack : seat.stack;
    const bet = hp !== undefined ? hp.bet : 0;
    const folded = hp !== undefined ? hp.folded : false;
    const allIn = hp !== undefined ? hp.allIn : false;
    const excluded = hp === undefined || hp.excluded;
    const isTurn = hp !== undefined && hand !== null && hand.currentTurnSeat === i;
    const view: SeatView = {
      seat: i,
      playerId: seat.playerId,
      nickname: seat.nickname,
      stack,
      bet,
      folded,
      allIn,
      connected: seat.connected,
      isBot: seat.isBot === true,
      isDealer: hand !== null && state.dealerSeat === i,
      isSmallBlind: hand !== null && sbSeat === i,
      isBigBlind: hand !== null && bbSeat === i,
      isTurn,
      isMe: seat.playerId === viewerPlayerId,
      excluded,
      lastAction: hp?.lastAction
        ? { type: hp.lastAction.type, amount: hp.lastAction.amount }
        : null,
    };
    if (viewerInHand && seat.playerId === viewerPlayerId && hp !== undefined) {
      view.holeCards = [...hp.holeCards];
    }
    seats.push(view);
  }

  return {
    tableId: state.tableId,
    name: state.name,
    version: state.version,
    handNumber: state.handNumber,
    maxSeats: state.maxSeats,
    smallBlind: state.smallBlind,
    bigBlind: state.bigBlind,
    buyIn: state.buyIn,
    phase: hand === null ? "idle" : hand.phase,
    dealerSeat: state.dealerSeat,
    seats,
    community,
    pots: hand === null ? [] : engine.buildPots(state),
    toCall: hand?.toCall ?? 0,
    minRaise: hand?.minRaise ?? state.bigBlind,
    currentTurnSeat: hand?.currentTurnSeat ?? -1,
    actionDeadlineAt: hand?.turnDeadlineAt ?? 0,
    mySeat: mySeat >= 0 ? mySeat : null,
    myHoleCards: viewerInHand ? (hand?.holeCardsByPlayer[viewerPlayerId] ?? null) : null,
    myLegalActions: mySeat >= 0 ? engine.legalActions(state, mySeat) : [],
    log: [...state.log].slice(-60),
    reveal: state.lastShowdown?.reveal ?? [],
    winners: state.lastShowdown?.winners ?? [],
    startedAt: state.createdAt,
  };
}

function dealerNext(state: TableState, from: number, step: number): number {
  for (let i = 1; i <= state.maxSeats; i++) {
    const seat = (from + i + state.maxSeats) % state.maxSeats;
    const s = state.seats[seat];
    if (s !== null && s !== undefined && s.stack > 0 && --step === 0) return seat;
  }
  return -1;
}
