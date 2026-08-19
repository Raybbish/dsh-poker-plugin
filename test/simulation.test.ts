import { test } from "node:test";
import assert from "node:assert/strict";
import { TableService } from "../src/host/table-service.js";
import { PokerEngine, seededRng, type ActionType, type LegalAction, type TableState } from "../src/engine/index.js";
import { buildTableView } from "../src/protocol.js";
import { FakeCtx, MemoryDomain } from "./helpers.js";

async function firstPrivateHand(seed: number): Promise<unknown> {
  const service = new TableService(
    new FakeCtx() as never,
    new MemoryDomain() as never,
    undefined,
    { now: () => 1_000_000, rng: seededRng(seed) },
  );
  const table = await service.createTable(`Seed ${seed}`, 6);
  const alice = await service.joinTable(table.tableId, "Alice", 1000);
  const bob = await service.joinTable(table.tableId, "Bob", 1000);
  await service.setConnected(alice.playerId, table.tableId, true);
  await service.setConnected(bob.playerId, table.tableId, true);
  const hand = service.snapshotFor(table.tableId, alice.playerId).myHoleCards;
  service.dispose();
  return hand;
}

test("seeded service RNG reproduces the same private deal", async () => {
  assert.deepEqual(await firstPrivateHand(202_608_19), await firstPrivateHand(202_608_19));
  assert.notDeepEqual(await firstPrivateHand(202_608_19), await firstPrivateHand(202_608_20));
});

function simulationTable(seed: number, players: number): TableState {
  const state: TableState = {
    tableId: `simulation-${seed}`,
    name: `Simulation ${seed}`,
    maxSeats: players,
    smallBlind: 5,
    bigBlind: 10,
    buyIn: 1000,
    version: 0,
    createdAt: seed,
    seats: new Array(players).fill(null),
    dealerSeat: -1,
    hand: null,
    handNumber: 0,
    log: [],
    appliedCommands: {},
    actionTimeoutMs: 30_000,
    lastShowdown: null,
  };
  for (let seat = 0; seat < players; seat += 1) {
    state.seats[seat] = {
      playerId: `seed-${seed}-player-${seat}`,
      nickname: `P${seat}`,
      token: `secret-${seed}-${seat}`,
      stack: 200 + ((seed * 97 + seat * 211) % 801),
      connected: true,
      joinedAt: seed,
    };
  }
  return state;
}

function amountFor(action: LegalAction, rng: ReturnType<typeof seededRng>): number | undefined {
  if (action.type !== "bet" && action.type !== "raise") return undefined;
  const min = action.min ?? 1;
  const max = action.max ?? min;
  return min + rng.nextInt(max - min + 1);
}

function assertPrivateViews(state: TableState, engine: PokerEngine, seed: number): void {
  const hand = state.hand;
  assert.ok(hand !== null);
  for (const viewer of hand.players) {
    const view = buildTableView(state, viewer.playerId, engine);
    assert.deepEqual(view.myHoleCards, viewer.holeCards, `seed ${seed}: viewer sees own cards`);
    for (const seat of view.seats) {
      if (seat.playerId === viewer.playerId) assert.deepEqual(seat.holeCards, viewer.holeCards);
      else assert.equal(Object.hasOwn(seat, "holeCards"), false, `seed ${seed}: opponent cards omitted`);
    }
    const wire = JSON.stringify(view);
    assert.doesNotMatch(wire, /secret-/);
    assert.doesNotMatch(wire, /"deck"|"holeCardsByPlayer"|"appliedCommands"/);
  }

  const spectator = buildTableView(state, "", engine);
  assert.equal(spectator.myHoleCards, null);
  assert.ok(spectator.seats.every((seat) => !Object.hasOwn(seat, "holeCards")));
}

test("500 seeded action simulations terminate while conserving chips and private views", () => {
  for (let seed = 1; seed <= 500; seed += 1) {
    const policyRng = seededRng(seed ^ 0x51f15e);
    const players = 2 + policyRng.nextInt(5);
    const state = simulationTable(seed, players);
    const engine = new PokerEngine({ rng: seededRng(seed), now: () => seed * 10_000 });
    const initialChips = engine.totalChips(state);
    assert.equal(engine.startHand(state).changed, true);

    let steps = 0;
    while (state.hand !== null && steps < 600) {
      assertPrivateViews(state, engine, seed);
      const actor = state.hand.currentTurnSeat;
      const legal = engine.legalActions(state, actor);
      assert.ok(legal.length > 0, `seed ${seed}: live hand has legal actor`);
      const action = legal[policyRng.nextInt(legal.length)]!;
      engine.applyAction(state, actor, action.type as ActionType, amountFor(action, policyRng));
      assert.equal(engine.totalChips(state), initialChips, `seed ${seed}: chip conservation`);
      steps += 1;
    }

    assert.equal(state.hand, null, `seed ${seed}: hand terminates within action guard`);
    assert.ok(steps < 600, `seed ${seed}: action guard was not exhausted`);
    assert.equal(engine.totalChips(state), initialChips, `seed ${seed}: final chip conservation`);
  }
});
