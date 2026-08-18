/**
 * Pure poker domain types — zero DSH / network / UI dependencies.
 *
 * All chip amounts are INTEGER (never floats). Cards are plain JSON-safe
 * objects {rank, suit} so they can cross the WebSocket boundary without
 * serialization surprises.
 */
export const MIN_RANK = 2;
export const MAX_RANK = 14;
export const SUIT_COUNT = 4;
export const DECK_SIZE = 52;
/** Stable string id of a card, e.g. "14s" for ace of spades. */
export function cardId(card) {
    return `${card.rank}${"cdhs"[card.suit] ?? "?"}`;
}
export function isCardBack(v) {
    return typeof v === "object" && v !== null && v.back === true;
}
export const DEFAULT_TABLE_CONFIG = {
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
//# sourceMappingURL=types.js.map