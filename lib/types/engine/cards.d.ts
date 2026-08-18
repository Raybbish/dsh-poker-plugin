import { Card } from "./types.js";
export interface Rng {
    /** Uniform integer in [0, n). */
    nextInt(n: number): number;
}
/** Crypto-backed uniform int via rejection sampling on randomBytes. */
export declare class CryptoRng implements Rng {
    nextInt(n: number): number;
}
/** Deterministic RNG for TESTS ONLY. Never used by production code paths. */
export declare function seededRng(seed: number): Rng;
export declare function buildDeck(): Card[];
/**
 * Fisher–Yates shuffle using a uniform RNG. The default RNG is crypto-backed.
 * @param rng - RNG; defaults to a fresh CryptoRng.
 */
export declare function shuffle(deck: Card[], rng?: Rng): Card[];
/** Deal `count` cards from the front of the deck. */
export declare function deal(deck: Card[], count: number): Card[];
/** Fresh, shuffled full deck. */
export declare function freshDeck(rng?: Rng): Card[];
/** Parse a card from its stable id (for tests and debug). */
export declare function parseCard(id: string): Card;
