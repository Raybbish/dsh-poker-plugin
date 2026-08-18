import { test } from "node:test";
import assert from "node:assert/strict";
import { compareHands, describeHand, evaluateBest, evaluateFive, HandCategory } from "../src/engine/evaluator.js";
import { parseCard } from "../src/engine/cards.js";

const hand = (...ids: string[]) => ids.map(parseCard);

interface Case {
  name: string;
  cards: string[];
  category: HandCategory;
  /** A weaker hand that this hand must beat. */
  beats?: string[];
  /** A stronger hand that this hand must lose to. */
  losesTo?: string[];
}

const CASES: Case[] = [
  {
    name: "royal flush",
    cards: ["14s", "13s", "12s", "11s", "10s"],
    category: HandCategory.STRAIGHT_FLUSH,
    beats: ["14c", "13c", "12c", "11c", "9c"],
  },
  {
    name: "straight flush (king high) loses to royal",
    cards: ["13h", "12h", "11h", "10h", "9h"],
    category: HandCategory.STRAIGHT_FLUSH,
    losesTo: ["14s", "13s", "12s", "11s", "10s"],
  },
  {
    name: "wheel straight (A-5) is a 5-high straight",
    cards: ["14c", "2c", "3d", "4h", "5s"],
    category: HandCategory.STRAIGHT,
    beats: ["13c", "2c", "3d", "4h", "5s"],
  },
  {
    name: "four of a kind",
    cards: ["9c", "9d", "9h", "9s", "5c"],
    category: HandCategory.FOUR_OF_A_KIND,
    beats: ["8c", "8d", "8h", "8s", "14c"],
  },
  {
    name: "full house",
    cards: ["10c", "10d", "10h", "4s", "4d"],
    category: HandCategory.FULL_HOUSE,
    beats: ["9c", "9d", "9h", "14s", "14d"],
    losesTo: ["10c", "10d", "10h", "5s", "5d"],
  },
  {
    name: "flush",
    cards: ["14c", "11c", "9c", "6c", "3c"],
    category: HandCategory.FLUSH,
    beats: ["13c", "11c", "9c", "6c", "3c"],
    losesTo: ["14d", "12d", "9d", "6d", "3d"],
  },
  {
    name: "straight",
    cards: ["10d", "9c", "8h", "7s", "6d"],
    category: HandCategory.STRAIGHT,
    beats: ["9d", "8c", "7h", "6s", "5d"],
    losesTo: ["11d", "10c", "9h", "8s", "7d"],
  },
  {
    name: "three of a kind",
    cards: ["7c", "7d", "7h", "14s", "2c"],
    category: HandCategory.THREE_OF_A_KIND,
    beats: ["6c", "6d", "6h", "14s", "2c"],
  },
  {
    name: "two pair",
    cards: ["13c", "13d", "4h", "4s", "9c"],
    category: HandCategory.TWO_PAIR,
    beats: ["12c", "12d", "3h", "3s", "14c"],
    losesTo: ["13c", "13d", "5h", "5s", "9c"],
  },
  {
    name: "one pair",
    cards: ["8c", "8d", "14h", "7s", "2c"],
    category: HandCategory.PAIR,
    beats: ["7c", "7d", "14h", "13s", "2c"],
    losesTo: ["8c", "8d", "14h", "7s", "3c"],
  },
  {
    name: "high card",
    cards: ["14c", "12d", "9h", "6s", "3d"],
    category: HandCategory.HIGH_CARD,
    beats: ["13c", "12d", "9h", "6s", "3d"],
    losesTo: ["14c", "13d", "9h", "6s", "3d"],
  },
  {
    name: "best 5 of 7 picks the flush over two pair",
    cards: ["14c", "11c", "9c", "6c", "3c", "10d", "10s"],
    category: HandCategory.FLUSH,
  },
  {
    name: "straight beats three of a kind in 7 cards",
    cards: ["9c", "9d", "9h", "10s", "8d", "7c", "6h"],
    category: HandCategory.STRAIGHT,
  },
  {
    name: "full house over flush in 7 cards",
    cards: ["9c", "9d", "9h", "4s", "4d", "2c", "13c"],
    category: HandCategory.FULL_HOUSE,
  },
  {
    name: "quads with ace kicker in 7 cards",
    cards: ["9c", "9d", "9h", "9s", "14c", "2d", "3h"],
    category: HandCategory.FOUR_OF_A_KIND,
  },
];

test("evaluator: table-driven categories and ordering", () => {
  for (const c of CASES) {
    const value = evaluateBest(hand(...c.cards));
    assert.equal(value[0], c.category, `${c.name}: category`);
    assert.ok(describeHand(value).length > 0, `${c.name}: describeHand non-empty`);
    if (c.beats !== undefined) {
      const weaker = evaluateBest(hand(...c.beats));
      assert.ok(compareHands(value, weaker) > 0, `${c.name} must beat ${c.beats.join(" ")}`);
    }
    if (c.losesTo !== undefined) {
      const stronger = evaluateBest(hand(...c.losesTo));
      assert.ok(compareHands(value, stronger) < 0, `${c.name} must lose to ${c.losesTo.join(" ")}`);
    }
  }
});

test("evaluator: exact ties compare equal", () => {
  const a = evaluateFive(hand("14c", "13d", "12h", "11s", "10c"));
  const b = evaluateFive(hand("14d", "13c", "12s", "11h", "10d"));
  assert.equal(compareHands(a, b), 0);
});

test("evaluator: evaluateFive rejects wrong card count", () => {
  assert.throws(() => evaluateFive(hand("14c", "13d", "12h", "11s")));
});

test("evaluator: describeHand labels", () => {
  assert.equal(describeHand(evaluateFive(hand("14s", "13s", "12s", "11s", "10s"))), "Royal Flush");
  assert.equal(describeHand(evaluateFive(hand("9c", "9d", "9h", "9s", "5c"))), "Four of a Kind, 9s");
  assert.equal(describeHand(evaluateFive(hand("10c", "10d", "10h", "4s", "4d"))), "Full House, Ts over 4s");
  assert.equal(describeHand(evaluateFive(hand("8c", "8d", "14h", "7s", "2c"))), "Pair of 8s");
});
