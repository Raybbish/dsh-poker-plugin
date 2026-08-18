/**
 * Texas Hold'em hand evaluator.
 *
 * Pure functions over `Card[]`. `evaluateBest` picks the best 5-card hand out
 * of up to 7 cards (2 hole + up to 5 community). Hands compare by a plain
 * array `[category, ...tiebreaks]` under lexicographic order.
 */
import { Card } from "./types.js";
export declare enum HandCategory {
    HIGH_CARD = 0,
    PAIR = 1,
    TWO_PAIR = 2,
    THREE_OF_A_KIND = 3,
    STRAIGHT = 4,
    FLUSH = 5,
    FULL_HOUSE = 6,
    FOUR_OF_A_KIND = 7,
    STRAIGHT_FLUSH = 8
}
export declare const CATEGORY_NAMES: Record<HandCategory, string>;
/**
 * A comparable hand value. Lexicographic comparison decides the winner.
 * - straight flush / straight: [cat, highRank]
 * - four of a kind: [cat, quadRank, kicker]
 * - full house: [cat, tripsRank, pairRank]
 * - flush / high card: [cat, r5, r4, r3, r2, r1]
 * - three of a kind: [cat, trips, k2, k1]
 * - two pair: [cat, highPair, lowPair, kicker]
 * - pair: [cat, pair, k3, k2, k1]
 */
export type HandValue = number[];
/** Evaluate exactly five cards. Assumes a valid 5-card hand. */
export declare function evaluateFive(cards: Card[]): HandValue;
/**
 * Best hand value from up to 7 cards (2..7). Chooses the best 5-card subset.
 */
export declare function evaluateBest(cards: Card[]): HandValue;
/** >0 when a beats b, 0 tie, <0 otherwise. */
export declare function compareHands(a: HandValue, b: HandValue): number;
/** Human label of a hand value for the log, e.g. "Pair of Aces, K kicker". */
export declare function describeHand(value: HandValue): string;
