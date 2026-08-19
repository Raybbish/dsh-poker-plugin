import { test } from "node:test";
import assert from "node:assert/strict";
import { TableService, TableError } from "../src/host/table-service.js";
import { MemoryDomain, FakeCtx, FakeClock } from "./helpers.js";
import { TableView } from "../src/protocol.js";
import { STARTING_WALLET } from "../src/engine/types.js";

interface Harness {
  service: TableService;
  ctx: FakeCtx;
  domain: MemoryDomain;
  clock: FakeClock;
}

function makeService(config?: ConstructorParameters<typeof TableService>[2], clockStart = 1_000_000): Harness {
  const ctx = new FakeCtx();
  const domain = new MemoryDomain();
  const clock = new FakeClock(clockStart);
  const service = new TableService(ctx as never, domain as never, config, { now: () => clock.now() });
  return { service, ctx, domain, clock };
}

async function setupTwoPlayers(h: Harness, buyIn = 1000): Promise<{ tableId: string; p1: { playerId: string; token: string; seat: number }; p2: { playerId: string; token: string; seat: number } }> {
  const table = await h.service.createTable("Test", 6);
  const p1 = await h.service.joinTable(table.tableId, "Alice", buyIn);
  const p2 = await h.service.joinTable(table.tableId, "Bob", buyIn);
  // Mark both connected so a hand can start.
  await h.service.setConnected(p1.playerId, table.tableId, true);
  await h.service.setConnected(p2.playerId, table.tableId, true);
  return { tableId: table.tableId, p1, p2 };
}

/** Drive one full hand to completion by always calling/checking. Returns the actions applied. */
async function playOut(h: Harness, tableId: string, players: { playerId: string }[]): Promise<void> {
  for (let guard = 0; guard < 200; guard++) {
    const state = h.service.getState(tableId)!;
    const hand = state.hand;
    if (hand === null) return;
    const seatIdx = hand.currentTurnSeat;
    const seat = state.seats[seatIdx];
    if (seat === null || seat === undefined) break;
    const version = state.version;
    const options = h.service.engine.legalActions(state, seatIdx);
    const opt = options.find((o) => o.type === "check") ?? options.find((o) => o.type === "call");
    if (opt === undefined) break;
    await h.service.action(seat.playerId, tableId, `cmd-${guard}-${seat.playerId}`, version, opt.type, "amount" in opt ? opt.amount : undefined);
  }
}

test("service: join grants wallet, buy-in debits it, cash-out credits it back", async () => {
  const h = makeService();
  const table = await h.service.createTable("T", 2);
  const joined = await h.service.joinTable(table.tableId, "Alice", 1000);
  assert.equal(joined.wallet, STARTING_WALLET - 1000);
  assert.equal(h.service.walletOf(joined.playerId), STARTING_WALLET - 1000);
  // grant idempotent
  assert.equal(h.service.ledger.size, 2); // grant + buy-in
  await h.service.leaveTable(joined.playerId, table.tableId);
  assert.equal(h.service.walletOf(joined.playerId), STARTING_WALLET);
});

test("service: deleting an active room cancels the hand, refunds every player's current chips, and removes persistence", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  const before = h.service.getState(tableId)!;
  assert.ok(before.hand !== null, "fixture has an active hand with posted blinds");
  assert.equal(h.service.walletOf(p1.playerId), STARTING_WALLET - 1000);
  assert.equal(h.service.walletOf(p2.playerId), STARTING_WALLET - 1000);

  await h.service.deleteTable(tableId);

  assert.equal(h.service.getState(tableId), undefined);
  assert.equal(h.service.lobbyView().some((table) => table.tableId === tableId), false);
  assert.equal(h.domain.tables.tables!.get(tableId), undefined);
  assert.equal(h.service.walletOf(p1.playerId), STARTING_WALLET);
  assert.equal(h.service.walletOf(p2.playerId), STARTING_WALLET);
  assert.equal(h.ctx.pendingTimeoutCount, 0, "the deleted room's turn timer is cancelled");
  await assert.rejects(h.service.deleteTable(tableId), (error: unknown) => (error as TableError).code === "table-not-found");
});

test("service: a deletion marked before a crash finishes idempotently during restart", async () => {
  const h = makeService();
  const table = await h.service.createTable("Crash delete", 2);
  const joined = await h.service.joinTable(table.tableId, "Alice", 1000);
  await h.domain.tables.tables!.update(table.tableId, (current) => ({ ...(current as object), deleting: true }));

  const restored = new TableService(new FakeCtx() as never, h.domain as never, undefined, { now: () => h.clock.now() });
  await restored.init();

  assert.equal(restored.getState(table.tableId), undefined);
  assert.equal(h.domain.tables.tables!.get(table.tableId), undefined);
  assert.equal(restored.walletOf(joined.playerId), STARTING_WALLET);
  assert.equal(restored.ledger.entriesFor(joined.playerId).filter((entry) => entry.reason === "cash-out").length, 1);
});

test("service: tables support up to 10 seats and reject an eleventh player", async () => {
  const h = makeService();
  const table = await h.service.createTable("Ten-handed", 10);
  assert.equal(table.maxSeats, 10);
  for (let i = 1; i <= 10; i++) await h.service.joinTable(table.tableId, `Player ${i}`, 1000);
  assert.equal(h.service.getState(table.tableId)!.seats.filter(Boolean).length, 10);
  await assert.rejects(
    h.service.joinTable(table.tableId, "Player 11", 1000),
    (error: unknown) => (error as TableError).code === "table-full",
  );
  const clamped = await h.service.createTable("Clamped", 99);
  assert.equal(clamped.maxSeats, 10);
});

test("service: two players connect → hand starts; everyone can act; chips conserved", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  const before = h.service.totalSystemChips();
  await playOut(h, tableId, [p1, p2]);
  const state = h.service.getState(tableId)!;
  assert.ok(state.handNumber >= 1);
  assert.equal(h.service.totalSystemChips(), before, "global conservation across hands");
});

test("service: expectedVersion fencing rejects stale commands", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  const state = h.service.getState(tableId)!;
  const seatIdx = state.hand!.currentTurnSeat;
  const actor = state.seats[seatIdx]!;
  const staleVersion = state.version;
  // Advance the game with one action...
  const options = h.service.engine.legalActions(state, seatIdx);
  await h.service.action(actor.playerId, tableId, "c1", staleVersion, options[0]!.type, "amount" in options[0]! ? options[0]!.amount : undefined);
  // ...then replay the same command id → dedup no-op (no error)
  const r = await h.service.action(actor.playerId, tableId, "c1", h.service.getState(tableId)!.version, "fold");
  assert.equal(r.applied, false);
  // ...then a DIFFERENT command id with the OLD version → stale error
  await assert.rejects(
    h.service.action(actor.playerId, tableId, "c2", staleVersion, "fold"),
    (e: unknown) => (e as TableError).code === "stale-version",
  );
});

test("service: duplicate commandId is idempotent and never double-applies", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  const before = h.service.totalSystemChips();
  const state = h.service.getState(tableId)!;
  const seatIdx = state.hand!.currentTurnSeat;
  const actor = state.seats[seatIdx]!;
  const options = h.service.engine.legalActions(state, seatIdx);
  const type = options[0]!.type;
  const amount = "amount" in options[0]! ? options[0]!.amount : undefined;
  await h.service.action(actor.playerId, tableId, "dup-1", state.version, type, amount);
  const versionAfter = h.service.getState(tableId)!.version;
  const r = await h.service.action(actor.playerId, tableId, "dup-1", versionAfter, type, amount);
  assert.equal(r.applied, false);
  assert.equal(h.service.getState(tableId)!.version, versionAfter);
  assert.equal(h.service.totalSystemChips(), before);
});

test("service: snapshots never leak other players' hole cards", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  const view1 = h.service.snapshotFor(tableId, p1.playerId);
  const view2 = h.service.snapshotFor(tableId, p2.playerId);
  const my1 = view1.seats.find((s) => s.playerId === p1.playerId)!;
  const opp1 = view1.seats.find((s) => s.playerId === p2.playerId)!;
  const my2 = view2.seats.find((s) => s.playerId === p2.playerId)!;
  const opp2 = view2.seats.find((s) => s.playerId === p1.playerId)!;
  assert.ok(my1.holeCards !== undefined && my1.holeCards.length === 2, "viewer sees own cards");
  assert.ok(opp1.holeCards === undefined, "viewer never sees opponent cards");
  assert.ok(my2.holeCards !== undefined && my2.holeCards.length === 2);
  assert.ok(opp2.holeCards === undefined);
  // deck and tokens never appear in any view
  const json = JSON.stringify(view1);
  assert.ok(!json.includes("token"));
  assert.ok(!json.includes("deck"));
});

test("service: disconnect and resume — seat kept, hand continues, reattach works", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  // disconnect p2
  await h.service.setConnected(p2.playerId, tableId, false);
  const view = h.service.snapshotFor(tableId, p1.playerId);
  const p2seat = view.seats.find((s) => s.playerId === p2.playerId)!;
  assert.equal(p2seat.connected, false);
  // resume with the right token
  const ok = await h.service.resume(p2.playerId, p2.token, tableId);
  assert.equal(ok, true);
  assert.equal(h.service.snapshotFor(tableId, p1.playerId).seats.find((s) => s.playerId === p2.playerId)!.connected, true);
  // wrong token is rejected
  const bad = await h.service.resume(p2.playerId, "wrong-token", tableId);
  assert.equal(bad, false);
});

test("service: a disconnected acting player is auto-folded after the deadline", async () => {
  const h = makeService(undefined, 2_000_000);
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  let state = h.service.getState(tableId)!;
  const first = state.seats[state.hand!.currentTurnSeat]!;
  // first actor (SB/dealer in HU) raises so the other player faces a bet
  const seatIdx = state.hand!.currentTurnSeat;
  const options = h.service.engine.legalActions(state, seatIdx);
  await h.service.action(first.playerId, tableId, "c-r", state.version, "raise", options.find((o) => o.type === "raise")!.min!);
  state = h.service.getState(tableId)!;
  // the other player is now the actor; disconnect them
  const otherSeat = state.seats[state.hand!.currentTurnSeat]!;
  const otherId = otherSeat.playerId;
  await h.service.setConnected(otherId, tableId, false);
  // advance the clock past the deadline and fire the armed turn timer
  h.clock.advance(31_000);
  h.ctx.fireLatestTimeout();
  await new Promise((r) => setTimeout(r, 0)); // let the enqueue chain settle
  state = h.service.getState(tableId)!;
  const otherInHand = state.hand?.players.find((p) => p.playerId === otherId);
  assert.ok(otherInHand === undefined || otherInHand.folded === true, "disconnected actor was auto-folded");
  assert.ok(state.log.some((e) => e.text.includes("auto-folds")), "log records the auto-fold");
});

test("service: leave mid-hand folds the player and cashes out at hand end", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  // three-handed table: A, B, C — C leaves mid-hand
  const p3 = await h.service.joinTable(tableId, "Carol", 1000);
  await h.service.setConnected(p3.playerId, tableId, true);
  // let the hand play a little (Carol might be acting — any seat order is fine)
  await h.service.leaveTable(p3.playerId, tableId);
  const state = h.service.getState(tableId)!;
  const carolSeat = state.seats.find((s) => s?.playerId === p3.playerId);
  if (state.hand !== null) {
    assert.ok(carolSeat !== null && carolSeat !== undefined && carolSeat.leaving === true, "seat marked leaving mid-hand");
    // finish the hand
    await playOut(h, tableId, [p1, p2]);
  }
  const state2 = h.service.getState(tableId)!;
  assert.ok(!state2.seats.some((s) => s?.playerId === p3.playerId), "seat freed after hand");
  assert.ok(h.service.ledger.has(`grant-${p3.playerId}`));
});

test("service: persists state and restores it on init (restart recovery)", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  await playOut(h, tableId, [p1, p2]);
  // "restart": a new service over the SAME domain, clock just after the old one
  // (so the restored hand's deadline has not expired yet)
  const ctx2 = new FakeCtx();
  const service2 = new TableService(ctx2 as never, h.domain as never, undefined, { now: () => 1_000_001 });
  await service2.init();
  const restored = service2.getState(tableId);
  assert.ok(restored !== undefined, "table restored after restart");
  assert.equal(restored!.handNumber, h.service.getState(tableId)!.handNumber);
  // wallets restored from the ledger
  assert.equal(service2.walletOf(p1.playerId), h.service.walletOf(p1.playerId));
  assert.equal(service2.walletOf(p2.playerId), h.service.walletOf(p2.playerId));
  // every player is marked disconnected on boot
  for (const seat of restored!.seats) {
    if (seat !== null && seat !== undefined) assert.equal(seat.connected, false);
  }
  // resume after restart works
  const ok = await service2.resume(p1.playerId, p1.token, tableId);
  assert.equal(ok, true);
});

test("service: conservation holds across joins, hands, leaves", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  const before = h.service.totalSystemChips(); // 2 grants
  await playOut(h, tableId, [p1, p2]);
  const p3 = await h.service.joinTable(tableId, "Diana", 500);
  await h.service.setConnected(p3.playerId, tableId, true);
  await playOut(h, tableId, [p1, p2, p3]);
  await h.service.leaveTable(p3.playerId, tableId);
  // third player's grant (10k) minus buy-in (500) plus cash-out (500) is net 10k
  assert.equal(h.service.totalSystemChips(), before + 10_000);
});

test("service: table full and wallet-too-low rejections", async () => {
  const h = makeService();
  const table = await h.service.createTable("T", 2);
  await h.service.joinTable(table.tableId, "A", 1000);
  await h.service.joinTable(table.tableId, "B", 1000);
  await assert.rejects(h.service.joinTable(table.tableId, "C", 1000), (e: unknown) => (e as TableError).code === "table-full");
  const t2 = await h.service.createTable("T2", 2);
  await assert.rejects(h.service.joinTable(t2.tableId, "D", 999999), (e: unknown) => (e as TableError).code === "insufficient-funds");
});

test("service: table view exposes legal actions only for the acting player", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  const view1: TableView = h.service.snapshotFor(tableId, p1.playerId);
  const view2: TableView = h.service.snapshotFor(tableId, p2.playerId);
  const acting = view1.seats.find((s) => s.isTurn);
  if (acting?.playerId === p1.playerId) {
    assert.ok(view1.myLegalActions.length > 0);
    assert.ok(view2.myLegalActions.length === 0);
  } else {
    assert.ok(view2.myLegalActions.length > 0);
    assert.ok(view1.myLegalActions.length === 0);
  }
});

test("service: the public log records every engine event exactly once (no duplicate lines)", async () => {
  const h = makeService();
  const { tableId, p1, p2 } = await setupTwoPlayers(h);
  // Drive exactly ONE scripted hand with unique nicknames so every line is
  // distinct within the hand. Stop as soon as hand #1 has concluded.
  for (let guard = 0; guard < 300; guard++) {
    const state = h.service.getState(tableId)!;
    if (state.hand === null) break;
    if (state.log.some((e) => /Hand #1 finished|wins \d/.test(e.text))) break;
    const seatIdx = state.hand.currentTurnSeat;
    const seat = state.seats[seatIdx];
    if (seat === null || seat === undefined) break;
    const legal = h.service.engine.legalActions(state, seatIdx);
    if (legal.length === 0) break;
    // Deterministic policy: raise the first two turns, then call/check down.
    const pick = guard < 2 ? legal.find((a) => a.type === "raise") ?? legal[0]! : legal.find((a) => a.type === "check") ?? legal.find((a) => a.type === "call") ?? legal[0]!;
    await h.service.action(seat.playerId, tableId, `log-${guard}`, state.version, pick.type, pick.type === "bet" || pick.type === "raise" ? pick.min : undefined);
  }
  const state = h.service.getState(tableId)!;
  assert.ok(state.handNumber >= 1, "a hand was played");
  assert.ok(state.log.some((e) => /Hand #1 finished|wins \d/.test(e.text)), "hand #1 concluded");
  // The duplicate-record bug produced TWO CONSECUTIVE identical entries (the
  // engine's own logEvent entry immediately followed by the service's re-push
  // of the same event). Legitimate repeats (e.g. "Alice checks." across
  // streets) are never consecutive, so asserting no adjacent duplicates
  // catches the bug without false positives.
  for (let i = 1; i < state.log.length; i++) {
    assert.notEqual(state.log[i]!.text, state.log[i - 1]!.text, `consecutive duplicate log line: ${state.log[i]!.text}`);
  }
});
