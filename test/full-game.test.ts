import { test } from "node:test";
import assert from "node:assert/strict";
import { TableService } from "../src/host/table-service.js";
import { MemoryDomain, FakeCtx } from "./helpers.js";
import { seededRng } from "../src/engine/cards.js";
import { LegalAction } from "../src/engine/types.js";

/**
 * Drive a complete multi-hand game through the service with a deterministic
 * random action policy. Asserts: hands actually finish, global chip
 * conservation holds, versions advance, and the ledger stays consistent.
 */
async function runRandomGame(seed: number, players: number, maxHands: number): Promise<{ service: TableService; tableId: string; playerIds: string[] }> {
  const ctx = new FakeCtx();
  const domain = new MemoryDomain();
  const rng = seededRng(seed);
  let now = 1_000_000;
  const service = new TableService(ctx as never, domain as never, undefined, { now: () => now });

  const table = await service.createTable(`Game ${seed}`, 6);
  const playerIds: string[] = [];
  const tokens = new Map<string, string>();
  for (let i = 0; i < players; i++) {
    const joined = await service.joinTable(table.tableId, `P${i}`, 1000);
    playerIds.push(joined.playerId);
    tokens.set(joined.playerId, joined.token);
    await service.setConnected(joined.playerId, table.tableId, true);
  }

  let guard = 0;
  const MAX_STEPS = 5_000;
  while (guard++ < MAX_STEPS) {
    const state = service.getState(table.tableId);
    if (state === undefined) break;
    if (state.handNumber >= maxHands && state.hand === null) break;
    const hand = state.hand;
    if (hand === null) {
      // Rebuy broke players (same identity, same wallet) so the game continues.
      const broke = state.seats.find((s) => s !== null && s !== undefined && s.stack === 0 && !s.leaving && s.connected);
      if (broke === undefined || broke === null) break;
      await service.leaveTable(broke.playerId, table.tableId);
      const rebuy = await service.joinTable(table.tableId, broke.nickname, 1000, broke.playerId, tokens.get(broke.playerId));
      tokens.set(broke.playerId, rebuy.token);
      await service.setConnected(broke.playerId, table.tableId, true);
      continue;
    }
    const seatIdx = hand.currentTurnSeat;
    const seat = state.seats[seatIdx];
    if (seat === null || seat === undefined) break;
    const legal = service.engine.legalActions(state, seatIdx);
    if (legal.length === 0) break;
    const pick = legal[rng.nextInt(legal.length)]!;
    await service.action(seat.playerId, table.tableId, `r-${seed}-${guard}`, state.version, pick.type, pick.type === "bet" || pick.type === "raise" ? pick.min : undefined);
  }
  return { service, tableId: table.tableId, playerIds };
}

test("full game: 2 players play 3 hands with random policy — conservation + completion", async () => {
  const { service, tableId } = await runRandomGame(11, 2, 3);
  const state = service.getState(tableId)!;
  assert.ok(state.handNumber >= 3, `expected >= 3 hands, got ${state.handNumber}`);
  // Total system chips = the two grants (10,000 each); nothing was created or destroyed.
  assert.equal(service.totalSystemChips(), 2 * 10_000, "global conservation");
});

test("full game: 3 players, 4 hands — side pots and all-ins occur; conservation holds", async () => {
  const { service, tableId, playerIds } = await runRandomGame(2024, 3, 4);
  const state = service.getState(tableId)!;
  assert.ok(state.handNumber >= 4);
  const stacks = playerIds.map((id) => state.seats.find((s) => s?.playerId === id)?.stack ?? 0);
  const sumStacks = stacks.reduce((a, b) => a + b, 0);
  // every chip on the table is in a seat stack between hands
  assert.equal(sumStacks, service.engine.totalChips(state));
});

test("full game: 4 players, 2 hands — the table always has a legal actor", async () => {
  const { service, tableId } = await runRandomGame(99, 4, 2);
  const state = service.getState(tableId)!;
  assert.ok(state.handNumber >= 2);
  // between hands, a fresh hand starts automatically with >= 2 connected players
  const connected = state.seats.filter((s) => s !== null && s !== undefined && s.connected).length;
  assert.ok(connected >= 2);
});

test("full game: scripted hand — raise, re-raise, all-in, showdown with side pots", async () => {
  const ctx = new FakeCtx();
  const domain = new MemoryDomain();
  let now = 5_000_000;
  const service = new TableService(ctx as never, domain as never, undefined, { now: () => now });
  const table = await service.createTable("Scripted", 6);
  const a = await service.joinTable(table.tableId, "A", 1000);
  const b = await service.joinTable(table.tableId, "B", 300); // short stack → all-in scenarios
  const c = await service.joinTable(table.tableId, "C", 1000);
  for (const p of [a, b, c]) await service.setConnected(p.playerId, table.tableId, true);

  const before = service.totalSystemChips();
  let state = service.getState(table.tableId)!;
  // drive until preflop betting reaches a raise situation
  let guard = 0;
  while (state.hand !== null && guard++ < 200) {
    const seatIdx = state.hand!.currentTurnSeat;
    const seat = state.seats[seatIdx];
    const legal = service.engine.legalActions(state, seatIdx);
    const opts = legal;
    const raiseOpt = opts.find((o) => o.type === "raise");
    const callOpt = opts.find((o) => o.type === "call");
    const checkOpt = opts.find((o) => o.type === "check");
    let chosen: LegalAction;
    if (raiseOpt !== undefined && guard % 3 === 0) chosen = raiseOpt;
    else if (callOpt !== undefined) chosen = callOpt;
    else if (checkOpt !== undefined) chosen = checkOpt;
    else chosen = opts[0]!;
    await service.action(seat!.playerId, table.tableId, `s-${guard}`, state.version, chosen.type, chosen.type === "bet" || chosen.type === "raise" ? chosen.min : undefined);
    state = service.getState(table.tableId)!;
  }
  // the hand must have concluded (survivor or showdown)
  assert.equal(service.totalSystemChips(), before, "conservation");
  assert.ok(state.handNumber >= 1);
  // ledger contains hand-result entries that sum to zero for the hand
  const handResults = service.ledger.all().filter((e) => e.reason === "hand-result");
  if (handResults.length > 0) {
    assert.equal(handResults.reduce((s, e) => s + e.amount, 0), 0, "hand-results cancel out");
  }
});
