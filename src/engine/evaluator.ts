/**
 * Texas Hold'em hand evaluator.
 *
 * Pure functions over `Card[]`. `evaluateBest` picks the best 5-card hand out
 * of up to 7 cards (2 hole + up to 5 community). Hands compare by a plain
 * array `[category, ...tiebreaks]` under lexicographic order.
 */
import { Card } from "./types.js";

export enum HandCategory {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
}

export const CATEGORY_NAMES: Record<HandCategory, string> = {
  [HandCategory.HIGH_CARD]: "High Card",
  [HandCategory.PAIR]: "Pair",
  [HandCategory.TWO_PAIR]: "Two Pair",
  [HandCategory.THREE_OF_A_KIND]: "Three of a Kind",
  [HandCategory.STRAIGHT]: "Straight",
  [HandCategory.FLUSH]: "Flush",
  [HandCategory.FULL_HOUSE]: "Full House",
  [HandCategory.FOUR_OF_A_KIND]: "Four of a Kind",
  [HandCategory.STRAIGHT_FLUSH]: "Straight Flush",
};

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

interface Counted {
  rank: number;
  count: number;
}

function sortedDesc(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.rank - a.rank);
}

/** Evaluate exactly five cards. Assumes a valid 5-card hand. */
export function evaluateFive(cards: Card[]): HandValue {
  if (cards.length !== 5) throw new Error("evaluateFive requires exactly 5 cards");
  const sorted = sortedDesc(cards);
  const ranks = sorted.map((c) => c.rank);
  const suits = sorted.map((c) => c.suit);

  const flush = suits.every((s) => s === suits[0]!);
  const isStraight = (rs: number[]): { ok: boolean; high: number } => {
    // unique consecutive, or wheel A-5-4-3-2
    const uniq = [...new Set(rs)].sort((a, b) => b - a);
    if (uniq.length === 5 && uniq[0]! - uniq[4]! === 4) return { ok: true, high: uniq[0]! };
    const wheel = [14, 5, 4, 3, 2];
    if (uniq.length === 5 && wheel.every((r) => uniq.includes(r))) return { ok: true, high: 5 };
    return { ok: false, high: 0 };
  };
  const straight = isStraight(ranks);

  if (flush && straight.ok) return [HandCategory.STRAIGHT_FLUSH, straight.high];

  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const counted: Counted[] = [...counts.entries()]
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  const of = (n: number) => counted.find((c) => c.count === n);
  const four = of(4);
  const three = of(3);
  const pairs = counted.filter((c) => c.count === 2).map((c) => c.rank);
  const kickers = counted.filter((c) => c.count === 1).map((c) => c.rank);

  if (four) return [HandCategory.FOUR_OF_A_KIND, four.rank, kickers[0] ?? 0];
  if (three && pairs.length > 0) return [HandCategory.FULL_HOUSE, three.rank, pairs[0]!];
  if (flush) return [HandCategory.FLUSH, ...ranks];
  if (straight.ok) return [HandCategory.STRAIGHT, straight.high];
  if (three) return [HandCategory.THREE_OF_A_KIND, three.rank, kickers[0] ?? 0, kickers[1] ?? 0];
  if (pairs.length >= 2) return [HandCategory.TWO_PAIR, pairs[0]!, pairs[1]!, kickers[0] ?? 0];
  if (pairs.length === 1) return [HandCategory.PAIR, pairs[0]!, kickers[0] ?? 0, kickers[1] ?? 0, kickers[2] ?? 0];
  return [HandCategory.HIGH_CARD, ...ranks];
}

const COMBINATIONS_7 = (() => {
  const out: number[][] = [];
  for (let a = 0; a < 7; a++)
    for (let b = a + 1; b < 7; b++)
      for (let c = b + 1; c < 7; c++)
        for (let d = c + 1; d < 7; d++)
          for (let e = d + 1; e < 7; e++) out.push([a, b, c, d, e]);
  return out;
})();

/**
 * Best hand value from up to 7 cards (2..7). Chooses the best 5-card subset.
 */
export function evaluateBest(cards: Card[]): HandValue {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`evaluateBest supports 5..7 cards, got ${cards.length}`);
  }
  if (cards.length === 5) return evaluateFive(cards);
  let best: HandValue | null = null;
  for (const idx of COMBINATIONS_7) {
    const five = idx.map((i) => cards[i]!);
    const value = evaluateFive(five);
    if (best === null || compareHands(value, best) > 0) best = value;
  }
  return best!;
}

/** >0 when a beats b, 0 tie, <0 otherwise. */
export function compareHands(a: HandValue, b: HandValue): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

const RANK_LABELS: Record<number, string> = {
  14: "A", 13: "K", 12: "Q", 11: "J", 10: "T",
  9: "9", 8: "8", 7: "7", 6: "6", 5: "5", 4: "4", 3: "3", 2: "2",
};

/** Human label of a hand value for the log, e.g. "Pair of Aces, K kicker". */
export function describeHand(value: HandValue): string {
  const cat = value[0] as HandCategory;
  const r = (i: number) => RANK_LABELS[value[i] ?? 0] ?? "?";
  switch (cat) {
    case HandCategory.STRAIGHT_FLUSH:
      return value[1] === 14 ? "Royal Flush" : `Straight Flush, ${r(1)} high`;
    case HandCategory.FOUR_OF_A_KIND:
      return `Four of a Kind, ${r(1)}s`;
    case HandCategory.FULL_HOUSE:
      return `Full House, ${r(1)}s over ${r(2)}s`;
    case HandCategory.FLUSH:
      return `Flush, ${r(1)} high`;
    case HandCategory.STRAIGHT:
      return `Straight, ${r(1)} high`;
    case HandCategory.THREE_OF_A_KIND:
      return `Three of a Kind, ${r(1)}s`;
    case HandCategory.TWO_PAIR:
      return `Two Pair, ${r(1)}s and ${r(2)}s`;
    case HandCategory.PAIR:
      return `Pair of ${r(1)}s`;
    default:
      return `High Card ${r(1)}`;
  }
}
