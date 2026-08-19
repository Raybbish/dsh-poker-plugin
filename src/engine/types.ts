/**
 * Pure poker domain types — zero DSH / network / UI dependencies.
 *
 * All chip amounts are INTEGER (never floats). Cards are plain JSON-safe
 * objects {rank, suit} so they can cross the WebSocket boundary without
 * serialization surprises.
 */

/** Card rank: 2..14 (11=J, 12=Q, 13=K, 14=A). */
export type Rank = number;
/** Card suit: 0..3 (0=clubs, 1=diamonds, 2=hearts, 3=spades). */
export type Suit = number;

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const MIN_RANK = 2;
export const MAX_RANK = 14;
export const SUIT_COUNT = 4;
export const DECK_SIZE = 52;

/** Stable string id of a card, e.g. "14s" for ace of spades. */
export function cardId(card: Card): string {
  return `${card.rank}${"cdhs"[card.suit] ?? "?"}`;
}

export interface CardBack {
  /** Render a facedown card: never carries rank/suit. */
  back: true;
}

export function isCardBack(v: unknown): v is CardBack {
  return typeof v === "object" && v !== null && (v as CardBack).back === true;
}

/** One seat on a table; null when unoccupied. */
export interface Seat {
  playerId: string;
  nickname: string;
  /** Authentication secret. NEVER leaves the server, never appears in views. */
  token: string;
  /** Chips currently on the table for this player (integer). */
  stack: number;
  /** Whether a live socket is attached right now. */
  connected: boolean;
  /** Server-controlled player driven by the configured poker bot adapter. */
  isBot?: boolean;
  joinedAt: number;
  /** Set when the player requested to leave mid-hand; the seat is freed at hand end. */
  leaving?: boolean;
}

export type HandPhase = "preflop" | "flop" | "turn" | "river" | "showdown";

export type ActionType = "fold" | "check" | "call" | "bet" | "raise" | "allin";

export interface PlayerAction {
  type: ActionType;
  /** For bet/raise: the TOTAL bet level (raise "to" amount). For call: amount paid. */
  amount: number;
  at: number;
}

/** A player's live state inside one hand. */
export interface HandPlayer {
  /** Seat index within the table. */
  seat: number;
  playerId: string;
  nickname: string;
  /** Private — server only. */
  holeCards: Card[];
  /** Stack at hand start (for ledger hand-results and audit). */
  startingStack: number;
  /** Chips in front of this player right now (stack − street commitments). */
  stack: number;
  /** Chips committed in the CURRENT street (for the "bet" badge). */
  bet: number;
  /** Total chips committed across all streets of this hand. */
  committed: number;
  folded: boolean;
  allIn: boolean;
  /** Has acted in the current street. */
  acted: boolean;
  lastAction?: PlayerAction;
  /** Excluded from the hand (e.g. broke with zero chips at hand start). */
  excluded: boolean;
}

/** One pot (main or side). */
export interface Pot {
  amount: number;
  /** playerIds eligible to win this pot. */
  eligiblePlayerIds: string[];
}

export interface HandState {
  handId: string;
  handNumber: number;
  phase: HandPhase;
  /** Remaining deck — server only. */
  deck: Card[];
  /** Private — server only until showdown. */
  holeCardsByPlayer: Record<string, Card[]>;
  community: Card[];
  players: HandPlayer[];
  /** Pots built from contributions so far (recomputed at street ends / showdown). */
  pots: Pot[];
  /** Current amount needed to call for the acting player. */
  toCall: number;
  /** Minimum raise INCREMENT (on top of toCall) for a legal full raise. */
  minRaise: number;
  currentTurnSeat: number;
  /** Epoch ms by which the current turn auto-acts (timeout rule). */
  turnDeadlineAt: number;
  /** Index into players of the last bettor/raiser, or -1. */
  lastAggressorIdx: number;
  /** Street number already dealt: 0 preflop, 3 flop, 4 turn, 5 river. */
  street: number;
  startedAt: number;
  finishedAt?: number;
  showdownRevealed?: boolean;
}

/** Public (never private) log line. */
export interface LogEntry {
  at: number;
  text: string;
  /** Hand id when the entry belongs to a hand. */
  handId?: string;
}

/** Public showdown result of the most recent finished hand (for display after the hand ends). */
export interface ShowdownResult {
  handNumber: number;
  handId: string;
  reveal: RevealInfo[];
  winners: WinnerInfo[];
  at: number;
}

/** One revealed showdown hand (cards are public at showdown by rule). */
export interface RevealInfo {
  playerId: string;
  nickname: string;
  /** Empty when the hand was mucked (single contender). */
  cards: string[];
  handLabel: string;
}

export interface WinnerInfo {
  playerId: string;
  nickname: string;
  amount: number;
  handLabel: string;
}

export interface TableState {
  tableId: string;
  name: string;
  maxSeats: number;
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
  /** Monotonic state version — every accepted command bumps it. */
  version: number;
  createdAt: number;
  /** seats[i] is the player at seat i, or null. */
  seats: (Seat | null)[];
  dealerSeat: number;
  hand: HandState | null;
  handNumber: number;
  log: LogEntry[];
  /** Commands already applied (per playerId, bounded) for idempotent replay. */
  appliedCommands: Record<string, string[]>;
  actionTimeoutMs: number;
  /** Result of the last finished hand, for post-hand display. */
  lastShowdown: ShowdownResult | null;
  /** Durable tombstone: restart must finish refunds before removing this room. */
  deleting?: boolean;
}

/** Server config for one table. */
export interface TableConfig {
  maxSeats: number;
  smallBlind: number;
  bigBlind: number;
  buyIn: number;
  actionTimeoutMs: number;
}

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  maxSeats: 6,
  smallBlind: 5,
  bigBlind: 10,
  buyIn: 1000,
  actionTimeoutMs: 30_000,
};

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;
export const STARTING_WALLET = 10_000;
export const MAX_LOG_ENTRIES = 100;

/** Legal action offered to one player by the server (client never computes rules). */
export interface LegalAction {
  type: ActionType;
  /** Exact amount for call; min/max for bet/raise (bet level); 0 otherwise. */
  amount?: number;
  min?: number;
  max?: number;
}
