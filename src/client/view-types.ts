/**
 * Light client-side view types — mirrors the server's wire shapes (see
 * src/protocol.ts). Type-only: no runtime imports from the host.
 */

export interface Card {
  rank: number;
  suit: number;
}

export interface LegalAction {
  type: string;
  amount?: number;
  min?: number;
  max?: number;
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface LogEntry {
  at: number;
  text: string;
  handId?: string;
}

export interface RevealInfo {
  playerId: string;
  nickname: string;
  cards: string[];
  handLabel: string;
}

export interface WinnerInfo {
  playerId: string;
  nickname: string;
  amount: number;
  handLabel: string;
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
  holeCards?: Card[];
  lastAction?: { type: string; amount: number } | null;
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
  phase: string;
  dealerSeat: number;
  seats: SeatView[];
  community: Card[];
  pots: Pot[];
  toCall: number;
  minRaise: number;
  currentTurnSeat: number;
  actionDeadlineAt: number;
  mySeat: number | null;
  myHoleCards: Card[] | null;
  myLegalActions: LegalAction[];
  log: LogEntry[];
  reveal: RevealInfo[];
  winners: WinnerInfo[];
  startedAt: number;
}

export interface LobbyTable {
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
