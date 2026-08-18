/**
 * Cards, deck construction, and SECURE shuffling.
 *
 * Production shuffles use `node:crypto` randomBytes with rejection sampling —
 * NEVER Math.random. Tests inject a deterministic RNG.
 */
import { randomBytes } from "node:crypto";
import { Card, DECK_SIZE, MAX_RANK, MIN_RANK, SUIT_COUNT } from "./types.js";

export interface Rng {
  /** Uniform integer in [0, n). */
  nextInt(n: number): number;
}

/** Crypto-backed uniform int via rejection sampling on randomBytes. */
export class CryptoRng implements Rng {
  nextInt(n: number): number {
    if (n <= 0) throw new RangeError("nextInt(n) requires n > 0");
    // Largest power-of-two range >= n, mask kept below 2^32 to stay in int32 math.
    const bits = Math.ceil(Math.log2(n));
    const bytes = Math.ceil(bits / 8);
    const mask = (1 << bits) - 1;
    for (;;) {
      const buf = randomBytes(bytes);
      let value = 0;
      for (let i = 0; i < bytes; i++) value = (value * 256 + buf[i]!) >>> 0;
      const capped = value & mask;
      if (capped < n) return capped;
      // reject and retry — uniform over [0, n)
    }
  }
}

/** Deterministic RNG for TESTS ONLY. Never used by production code paths. */
export function seededRng(seed: number): Rng {
  // mulberry32
  let state = seed >>> 0;
  return {
    nextInt(n: number): number {
      if (n <= 0) throw new RangeError("nextInt(n) requires n > 0");
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      const out = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return Math.floor(out * n);
    },
  };
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (let rank = MIN_RANK; rank <= MAX_RANK; rank++) {
    for (let suit = 0; suit < SUIT_COUNT; suit++) deck.push({ rank, suit });
  }
  if (deck.length !== DECK_SIZE) throw new Error("deck build invariant violated");
  return deck;
}

/**
 * Fisher–Yates shuffle using a uniform RNG. The default RNG is crypto-backed.
 * @param rng - RNG; defaults to a fresh CryptoRng.
 */
export function shuffle(deck: Card[], rng: Rng = new CryptoRng()): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const tmp = deck[i]!;
    deck[i] = deck[j]!;
    deck[j] = tmp;
  }
  return deck;
}

/** Deal `count` cards from the front of the deck. */
export function deal(deck: Card[], count: number): Card[] {
  if (count > deck.length) throw new Error("deal: not enough cards");
  return deck.splice(0, count);
}

/** Fresh, shuffled full deck. */
export function freshDeck(rng: Rng = new CryptoRng()): Card[] {
  return shuffle(buildDeck(), rng);
}

/** Parse a card from its stable id (for tests and debug). */
export function parseCard(id: string): Card {
  const rank = Number(id.slice(0, -1));
  const suit = "cdhs".indexOf(id.slice(-1));
  if (!Number.isInteger(rank) || rank < MIN_RANK || rank > MAX_RANK || suit < 0) {
    throw new Error(`parseCard: bad id ${id}`);
  }
  return { rank, suit };
}
