import { test } from "node:test";
import assert from "node:assert/strict";
import { PokerEngine, EngineError, buildPotsFrom } from "../src/engine/engine.js";
import { TableState, TableConfig } from "../src/engine/types.js";
import { seededRng } from "../src/engine/cards.js";

function makeTable(players: { nickname: string; stack: number }[], maxSeats = 6): TableState {
  const state: TableState = {
    tableId: "t1",
    name: "Test",
    maxSeats,
    smallBlind: 5,
    bigBlind: 10,
    buyIn: 1000,
    version: 0,
    createdAt: 0,
    seats: new Array(maxSeats).fill(null),
    dealerSeat: -1,
    hand: null,
    handNumber: 0,
    log: [],
    appliedCommands: {},
    actionTimeoutMs: 30_000,
    lastShowdown: null,
  };
  players.forEach((p, i) => {
    state.seats[i] = {
      playerId: `p${i}`,
      nickname: p.nickname,
      token: `tok${i}`,
      stack: p.stack,
      connected: true,
      joinedAt: 0,
    };
  });
  return state;
}

function engine(): PokerEngine {
  return new PokerEngine({ rng: seededRng(42), now: () => 1_000_000 });
}

/** Current turn seat of the live hand. */
function turn(state: TableState): number {
  return state.hand!.currentTurnSeat;
}

function act(state: TableState, eng: PokerEngine, seat: number, type: string, amount?: number): void {
  eng.applyAction(state, seat, type as never, amount);
}

function legal(state: TableState, eng: PokerEngine, seat: number): string[] {
  return eng.legalActions(state, seat).map((a) => a.type);
}

test("startHand: blinds, deal, first actor (3 players: UTG = dealer)", () => {
  const state = makeTable([{ nickname: "A", stack: 1000 }, { nickname: "B", stack: 1000 }, { nickname: "C", stack: 1000 }]);
  const eng = engine();
  const out = eng.startHand(state);
  assert.ok(out.changed);
  const hand = state.hand!;
  assert.equal(hand.phase, "preflop");
  assert.equal(state.dealerSeat, 0);
  // SB seat1 posted 5, BB seat2 posted 10
  const sb = hand.players.find((p) => p.seat === 1)!;
  const bb = hand.players.find((p) => p.seat === 2)!;
  assert.equal(sb.bet, 5);
  assert.equal(bb.bet, 10);
  assert.equal(hand.toCall, 10);
  assert.equal(hand.minRaise, 10);
  assert.equal(hand.currentTurnSeat, 0); // UTG = dealer with 3 players
  for (const p of hand.players) assert.equal(p.holeCards.length, 2);
  // deck is private and reduced
  assert.equal(hand.deck.length, 52 - 6);
  // no cards leak into log
  for (const entry of state.log) assert.ok(!/[0-9]{2}[cdhs]/.test(entry.text));
});

test("startHand: heads-up — the dealer is the small blind and acts first preflop", () => {
  const state = makeTable([{ nickname: "A", stack: 1000 }, { nickname: "B", stack: 1000 }]);
  const eng = engine();
  eng.startHand(state);
  // dealer=0 (=SB); BB=1; first actor after BB = seat 0 (the SB/dealer)
  assert.equal(state.hand!.currentTurnSeat, 0);
  assert.equal(state.hand!.toCall, 10);
  const sb = state.hand!.players.find((p) => p.seat === 0)!;
  const bb = state.hand!.players.find((p) => p.seat === 1)!;
  assert.equal(sb.bet, 5);
  assert.equal(bb.bet, 10);
  // BB holds the option (not marked acted)
  assert.equal(bb.acted, false);
});

test("heads-up full action order preflop + postflop", () => {
  const state = makeTable([{ nickname: "A", stack: 1000 }, { nickname: "B", stack: 1000 }]);
  const eng = engine();
  eng.startHand(state);
  // SB (seat0) calls, BB (seat1) option: checks → flop
  act(state, eng, 0, "call");
  act(state, eng, 1, "check");
  assert.equal(state.hand!.phase, "flop");
  assert.equal(state.hand!.community.length, 3);
  // Postflop the BB (seat1) acts first
  assert.equal(state.hand!.currentTurnSeat, 1);
  act(state, eng, 1, "check");
  act(state, eng, 0, "check");
  assert.equal(state.hand!.phase, "turn");
  assert.equal(state.hand!.community.length, 4);
  act(state, eng, 1, "check");
  act(state, eng, 0, "check");
  assert.equal(state.hand!.phase, "river");
  assert.equal(state.hand!.community.length, 5);
});

test("BB option: BB can check or raise when everyone limps", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  // dealer=0, SB=1, BB=2; order: A (UTG) → B → C (BB option)
  act(state, eng, 0, "call");
  act(state, eng, 1, "call");
  assert.equal(turn(state), 2);
  const options = legal(state, eng, 2);
  assert.ok(options.includes("check"));
  assert.ok(options.includes("raise"));
  act(state, eng, 2, "raise", 30);
  assert.equal(state.hand!.toCall, 30);
  // A must re-act
  assert.equal(turn(state), 0);
});

test("illegal actions are rejected", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  // out of turn
  assert.throws(() => act(state, eng, 1, "check"), (e: unknown) => (e as EngineError).code === "not-your-turn");
  // betting (not raising) is illegal while facing the blinds
  assert.throws(() => act(state, eng, 0, "bet", 10.5), (e: unknown) => (e as EngineError).code === "illegal-bet");
  // non-integer raise amount
  assert.throws(() => act(state, eng, 0, "raise", 10.5), (e: unknown) => (e as EngineError).code === "illegal-amount");
  // raise below minimum (must reach toCall + minRaise = 20)
  assert.throws(() => act(state, eng, 0, "raise", 15), (e: unknown) => (e as EngineError).code === "illegal-amount");
  act(state, eng, 0, "raise", 30);
  // check when facing a bet
  assert.throws(() => act(state, eng, 1, "check"), (e: unknown) => (e as EngineError).code === "illegal-check");
  // raise below the new minimum (30 + 20 = 50)
  assert.throws(() => act(state, eng, 1, "raise", 35), (e: unknown) => (e as EngineError).code === "illegal-amount");
  act(state, eng, 1, "fold");
  act(state, eng, 2, "call");
  // flop: postflop order is SB(1 folded) → BB(2) → BTN(0)
  act(state, eng, 2, "check");
  act(state, eng, 0, "bet", 20);
  // non-integer raise amount on the flop
  assert.throws(() => act(state, eng, 2, "raise", 20.5), (e: unknown) => (e as EngineError).code === "illegal-amount");
});

test("min-raise progression: bet 20 → next raise must reach 40", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  // everyone limps to the flop (A UTG → B SB → C BB option)
  act(state, eng, 0, "call");
  act(state, eng, 1, "call");
  act(state, eng, 2, "check");
  assert.equal(state.hand!.phase, "flop");
  // postflop order: SB(1) → BB(2) → BTN(0); B bets 20 on the flop
  act(state, eng, 1, "bet", 20);
  assert.equal(state.hand!.toCall, 20);
  assert.equal(state.hand!.minRaise, 20);
  // C may raise to at least 40
  const raise = eng.legalActions(state, 2).find((a) => a.type === "raise");
  assert.equal(raise!.min, 40);
  assert.throws(() => act(state, eng, 2, "raise", 39), (e: unknown) => (e as EngineError).code === "illegal-amount");
  act(state, eng, 2, "raise", 40);
  assert.equal(state.hand!.minRaise, 20);
});

test("all-in short raise moves toCall but does not reopen betting", () => {
  const state = makeTable([
    { nickname: "A", stack: 500 },
    { nickname: "B", stack: 150 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  // A (UTG) raises to 100 (full raise from 10: increment 90 ≥ 10)
  act(state, eng, 0, "raise", 100);
  // B (SB) goes all-in for 150 — only a 50 increment (< minRaise 90) → short raise
  act(state, eng, 1, "allin");
  assert.equal(state.hand!.toCall, 150);
  // C (BB, not yet acted) must act next
  assert.equal(turn(state), 2);
  // C may still raise (never acted)
  const cOptions = legal(state, eng, 2);
  assert.ok(cOptions.includes("raise"));
  act(state, eng, 2, "call");
  // A already acted and the raise was short → A may only call/fold, not re-raise
  const aOptions = legal(state, eng, 0);
  assert.ok(aOptions.includes("fold"));
  assert.ok(aOptions.includes("call"));
  assert.ok(!aOptions.includes("raise"));
  assert.throws(() => act(state, eng, 0, "raise", 300), (e: unknown) => (e as EngineError).code === "illegal-raise");
});

test("full raise reopens betting for players who already acted", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  act(state, eng, 0, "call");
  act(state, eng, 1, "raise", 40); // full raise (increment 30 ≥ 10)
  act(state, eng, 2, "call"); // BB calls → action returns to A
  // A's betting is reopened by the full raise
  const aOptions = legal(state, eng, 0);
  assert.ok(aOptions.includes("raise"));
  act(state, eng, 0, "raise", 80);
  assert.equal(state.hand!.toCall, 80);
  assert.equal(state.hand!.minRaise, 40);
});

test("side pots are built correctly with multiple all-ins", () => {
  const contributors = [
    { playerId: "A", amount: 100, folded: false },
    { playerId: "B", amount: 200, folded: false },
    { playerId: "C", amount: 200, folded: false },
    { playerId: "D", amount: 60, folded: true }, // folded after contributing 60
  ];
  const { pots, refunds } = buildPotsFrom(contributors);
  assert.equal(refunds.length, 0);
  // level 60: everyone's first 60 = 240, eligible A,B,C (D folded)
  // level 100: next 40 from A,B,C = 120, eligible A,B,C
  // level 200: next 100 from B,C = 200, eligible B,C
  assert.equal(pots.length, 3);
  assert.equal(pots[0]!.amount, 240);
  assert.deepEqual([...pots[0]!.eligiblePlayerIds].sort(), ["A", "B", "C"]);
  assert.equal(pots[1]!.amount, 120);
  assert.deepEqual([...pots[1]!.eligiblePlayerIds].sort(), ["A", "B", "C"]);
  assert.equal(pots[2]!.amount, 200);
  assert.deepEqual([...pots[2]!.eligiblePlayerIds].sort(), ["B", "C"]);
});

test("uncalled chips above the top eligible level are refunded (conservation)", () => {
  // Folded contributor F put in 250 while A/B only covered 200 each.
  const { pots, refunds } = buildPotsFrom([
    { playerId: "A", amount: 200, folded: false },
    { playerId: "B", amount: 200, folded: false },
    { playerId: "F", amount: 250, folded: true },
  ]);
  assert.equal(pots.length, 1);
  assert.equal(pots[0]!.amount, 600);
  assert.deepEqual([...pots[0]!.eligiblePlayerIds].sort(), ["A", "B"]);
  // level 250: slice = 50 (F only) → refunded to F
  assert.deepEqual(refunds, [{ playerId: "F", amount: 50 }]);
});

test("showdown with side pots awards each pot and conserves chips", () => {
  const state = makeTable([
    { nickname: "A", stack: 100 },
    { nickname: "B", stack: 200 },
    { nickname: "C", stack: 200 },
  ]);
  const eng = engine();
  const before = eng.totalChips(state);
  eng.startHand(state);
  // A all-in 100; B all-in 200; C calls all-in 200 → everyone all-in → runout
  act(state, eng, 0, "allin");
  act(state, eng, 1, "allin");
  act(state, eng, 2, "call");
  // runout + showdown finish the hand immediately
  assert.equal(state.hand, null);
  const after = eng.totalChips(state);
  assert.equal(before, after, "chips conserved across the hand");
  const total = state.seats.reduce((sum, s) => sum + (s?.stack ?? 0), 0);
  assert.equal(total, before);
  assert.ok(state.lastShowdown !== null);
  // two pots were contested (main 300, side 200) — winners sum to 500
  const winnersTotal = state.lastShowdown!.winners.reduce((s, w) => s + w.amount, 0);
  assert.equal(winnersTotal, 500);
});

test("survivor wins without showdown when everyone else folds", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  const before = eng.totalChips(state);
  act(state, eng, 0, "call"); // SB calls
  act(state, eng, 1, "raise", 50); // BB raises
  act(state, eng, 0, "fold"); // SB folds
  assert.equal(state.hand, null);
  // BB (seat 1): 1000 - 10 (blind) - 40 (raise) + 60 (pot) = 1010
  const stackB = state.seats[1]!.stack;
  assert.equal(stackB, 1010, "winner takes the whole pot");
  assert.equal(eng.totalChips(state), before, "chips conserved");
  // no showdown reveal happened (mucked)
  assert.equal(state.lastShowdown!.reveal.length, 0);
});

test("timeout auto-act: folds when facing a bet, checks otherwise, only after deadline", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = new PokerEngine({ rng: seededRng(7), now: () => 1_000_000 });
  eng.startHand(state);
  const hand = state.hand!;
  // Before the deadline: no auto action.
  const early = eng.autoAct(state, hand.turnDeadlineAt - 1);
  assert.equal(early.changed, false);
  // A raises 30 → B faces a bet and times out → auto-fold
  act(state, eng, 0, "raise", 30);
  const bSeat = turn(state);
  const deadline = state.hand!.turnDeadlineAt;
  const outcome = eng.autoAct(state, deadline + 1);
  assert.ok(outcome.changed);
  const bPlayer = state.hand!.players.find((p) => p.seat === bSeat)!;
  assert.equal(bPlayer.folded, true);
  assert.ok(state.log.some((e) => e.text.includes("auto-folds")));
});

test("timeout auto-act: auto-checks when facing no bet", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = new PokerEngine({ rng: seededRng(7), now: () => 1_000_000 });
  eng.startHand(state);
  act(state, eng, 0, "call");
  act(state, eng, 1, "call");
  act(state, eng, 2, "check"); // flop, toCall = 0
  const cSeat = turn(state); // postflop first actor
  const cDeadline = state.hand!.turnDeadlineAt;
  const outcome = eng.autoAct(state, cDeadline + 1);
  assert.ok(outcome.changed);
  const cPlayer = state.hand!.players.find((p) => p.seat === cSeat)!;
  assert.equal(cPlayer.folded, false);
  assert.ok(state.log.some((e) => e.text.includes("auto-checks")));
});

test("removePlayer folds a non-turning player and can end the hand", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  act(state, eng, 0, "call");
  // B leaves mid-hand (not their turn yet)
  const outcome = eng.removePlayer(state, "p1", "left the table");
  assert.ok(outcome.changed);
  const b = state.hand!.players.find((p) => p.playerId === "p1")!;
  assert.equal(b.folded, true);
});

test("broke player is excluded from the hand", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 0 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = engine();
  const out = eng.startHand(state);
  assert.ok(out.changed);
  // B (stack 0) is not a participant at all
  assert.ok(state.hand!.players.every((p) => p.playerId !== "p1"));
  assert.equal(state.hand!.players.length, 2);
  assert.ok(state.hand!.currentTurnSeat >= 0);
});

test("blinds all-in: short big blind sets toCall to its stack", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 6 }, // BB with 6 < 10
  ]);
  const eng = engine();
  eng.startHand(state);
  const hand = state.hand!;
  assert.equal(hand.toCall, 6);
  const bb = hand.players.find((p) => p.seat === 1)!; // BB is seat 1 in HU
  assert.equal(bb.allIn, true);
  assert.equal(bb.stack, 0);
});

test("chips are conserved across a full betting sequence", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
    { nickname: "C", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  const before = eng.totalChips(state);
  act(state, eng, 0, "raise", 40);
  act(state, eng, 1, "raise", 100);
  act(state, eng, 2, "allin");
  act(state, eng, 0, "fold");
  act(state, eng, 1, "call");
  assert.equal(state.hand, null); // B wins by default? No — B and C all-in → showdown
  assert.equal(eng.totalChips(state), before);
});

test("odd chip in a tied pot goes to the first player left of the dealer", () => {
  // Craft a river state: A and B tie with identical best hands; folded C's
  // odd contribution makes the main pot 297 (odd) → 148 / 149 split.
  const state = makeTable([
    { nickname: "A", stack: 50 },
    { nickname: "B", stack: 50 },
    { nickname: "C", stack: 0 },
  ]);
  state.dealerSeat = 0;
  state.hand = {
    handId: "h-odd",
    handNumber: 1,
    phase: "river",
    deck: [],
    holeCardsByPlayer: {
      p0: [
        { rank: 14, suit: 2 },
        { rank: 12, suit: 2 },
      ],
      p1: [
        { rank: 14, suit: 3 },
        { rank: 12, suit: 3 },
      ],
    },
    community: [
      { rank: 5, suit: 0 },
      { rank: 6, suit: 1 },
      { rank: 7, suit: 2 },
      { rank: 8, suit: 3 },
      { rank: 2, suit: 1 },
    ],
    players: [
      { seat: 0, playerId: "p0", nickname: "A", holeCards: [], startingStack: 150, stack: 50, bet: 0, committed: 100, folded: false, allIn: false, acted: false, excluded: false },
      { seat: 1, playerId: "p1", nickname: "B", holeCards: [], startingStack: 150, stack: 50, bet: 0, committed: 100, folded: false, allIn: false, acted: false, excluded: false },
      { seat: 2, playerId: "p2", nickname: "C", holeCards: [], startingStack: 99, stack: 0, bet: 0, committed: 99, folded: true, allIn: false, acted: true, excluded: false },
    ],
    pots: [],
    toCall: 0,
    minRaise: 10,
    currentTurnSeat: 1,
    turnDeadlineAt: 0,
    lastAggressorIdx: -1,
    street: 5,
    startedAt: 0,
  };
  const eng = engine();
  const before = eng.totalChips(state);
  // B checks, A checks → river completes → showdown
  act(state, eng, 1, "check");
  act(state, eng, 0, "check");
  assert.equal(state.hand, null);
  assert.ok(state.lastShowdown !== null);
  const totals = new Map<string, number>();
  for (const w of state.lastShowdown!.winners) totals.set(w.playerId, (totals.get(w.playerId) ?? 0) + w.amount);
  // main pot 297 (odd): 149 + 148; side pot 2: 1 + 1 → B 150 (left of the button), A 149
  assert.equal(totals.get("p1"), 150, "odd chip goes to the first player left of the dealer (B, seat 1)");
  assert.equal(totals.get("p0"), 149);
  assert.equal(eng.totalChips(state), before, "conserved");
  const total = state.seats.reduce((sum, s) => sum + (s?.stack ?? 0), 0);
  assert.equal(total, before);
});

test("deck never leaks through the public log", () => {
  const state = makeTable([
    { nickname: "A", stack: 1000 },
    { nickname: "B", stack: 1000 },
  ]);
  const eng = engine();
  eng.startHand(state);
  act(state, eng, 0, "call"); // SB calls
  act(state, eng, 1, "check"); // BB checks → flop
  act(state, eng, 1, "bet", 20); // BB acts first postflop
  act(state, eng, 0, "allin");
  act(state, eng, 1, "call");
  for (const entry of state.log) {
    assert.ok(!/\b(2|3|4|5|6|7|8|9|10|11|12|13|14)[cdhs]\b/.test(entry.text), `log leaked cards: ${entry.text}`);
  }
});
