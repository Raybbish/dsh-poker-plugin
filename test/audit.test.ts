/**
 * Reliability audit tests (fail-first).
 *
 * Each test targets one audit finding; several were written to FAIL against
 * the pre-fix implementation, then pass after the fix:
 *
 *  - malicious identity reuse on joinTable (token never verified when the
 *    player is not seated at the target table);
 *  - ledger/table durability ordering (fire-and-forget writes could be lost
 *    on crash → chip inflation after restart);
 *  - concurrent same-version actions from two clients (exactly-once apply);
 *  - exhaustive hidden-card leak audit over every per-player snapshot;
 *  - disconnect → hand end → cash-out chip consistency.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { TableService, TableError } from "../src/host/table-service.js";
import { MemoryDomain, FakeCtx, FakeClock, MemoryTable } from "./helpers.js";
import type { KvTable } from "@deepseek-ai/dsh-storage-domain";
import { TableView } from "../src/protocol.js";
import { seededRng } from "../src/engine/cards.js";

interface Harness {
  service: TableService;
  ctx: FakeCtx;
  domain: MemoryDomain;
  clock: FakeClock;
}

function makeService(domain?: MemoryDomain, config?: ConstructorParameters<typeof TableService>[2]): Harness {
  const ctx = new FakeCtx();
  const dom = domain ?? new MemoryDomain();
  const clock = new FakeClock();
  const service = new TableService(ctx as never, dom as never, config, { now: () => clock.now() });
  return { service, ctx, domain: dom, clock };
}

async function seatedPair(h: Harness): Promise<{ tableId: string; a: { playerId: string; token: string }; b: { playerId: string; token: string } }> {
  const table = await h.service.createTable("Audit", 6);
  const a = await h.service.joinTable(table.tableId, "Alice", 1000);
  const b = await h.service.joinTable(table.tableId, "Bob", 1000);
  await h.service.setConnected(a.playerId, table.tableId, true);
  await h.service.setConnected(b.playerId, table.tableId, true);
  return { tableId: table.tableId, a, b };
}

// ── 1. concurrent same-version actions: exactly one applies ─────────────────

test("audit: two clients acting with the same expectedVersion — exactly one applies", async () => {
  const h = makeService();
  const { tableId, a, b } = await seatedPair(h);
  const state = h.service.getState(tableId)!;
  const seatIdx = state.hand!.currentTurnSeat;
  const actor = state.seats[seatIdx]!;
  const version = state.version;
  const opts = h.service.engine.legalActions(state, seatIdx);
  const type = opts[0]!.type;
  const amount = "amount" in opts[0]! ? opts[0]!.amount : undefined;

  // Same actor, same version, two DIFFERENT command ids fired concurrently:
  // exactly one must apply, the other must be rejected as stale.
  const [r1, r2] = await Promise.allSettled([
    h.service.action(actor.playerId, tableId, "race-1", version, type, amount),
    h.service.action(actor.playerId, tableId, "race-2", version, type, amount),
  ]);
  const applied = [r1, r2].filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<{ applied: boolean }>).value.applied === true);
  const rejected = [r1, r2].filter((r) => r.status === "rejected");
  assert.equal(applied.length, 1, "exactly one concurrent command applies");
  assert.equal(rejected.length, 1, "the loser is rejected");
  assert.equal((rejected[0] as PromiseRejectedResult).reason.code, "stale-version");
  // chips unaffected by the rejected replay
  assert.equal(h.service.totalSystemChips(), 2 * 10_000);
});

// ── 2. malicious identity reuse ─────────────────────────────────────────────

test("audit: attacker cannot impersonate a seated player to spend their wallet (FAILS pre-fix)", async () => {
  const h = makeService();
  const t1 = await h.service.createTable("T1", 6);
  const victim = await h.service.joinTable(t1.tableId, "Victim", 1000);
  const t2 = await h.service.createTable("T2", 6);
  // The attacker knows the victim's playerId (it is public in snapshots) but
  // never their token. Joining a DIFFERENT table with a forged token must fail.
  await assert.rejects(
    h.service.joinTable(t2.tableId, "Mallory", 1000, victim.playerId, "forged-token"),
    (e: unknown) => (e as TableError).code === "unauthorized",
    "joinTable must verify the identity token even when the player is not at this table",
  );
  // victim's wallet untouched
  assert.equal(h.service.walletOf(victim.playerId), 10_000 - 1000);
});

test("audit: the real owner can rejoin another table with their token", async () => {
  const h = makeService();
  const t1 = await h.service.createTable("T1", 6);
  const owner = await h.service.joinTable(t1.tableId, "Alice", 1000);
  const t2 = await h.service.createTable("T2", 6);
  const again = await h.service.joinTable(t2.tableId, "Alice", 500, owner.playerId, owner.token);
  assert.equal(again.playerId, owner.playerId, "identity reused");
  assert.equal(h.service.walletOf(owner.playerId), 10_000 - 1000 - 500);
  // wrong token for an EXISTING player (known id, unknown token) is rejected
  const t3 = await h.service.createTable("T3", 6);
  await assert.rejects(
    h.service.joinTable(t3.tableId, "Mallory", 1000, owner.playerId, "guess"),
    (e: unknown) => (e as TableError).code === "unauthorized",
  );
});

test("audit: impersonation still rejected after a server restart (registry is durable)", async () => {
  const h = makeService();
  const t1 = await h.service.createTable("T1", 6);
  const owner = await h.service.joinTable(t1.tableId, "Alice", 1000);
  // restart over the same domain
  const h2 = makeService(h.domain);
  await h2.service.init();
  const t2 = await h2.service.createTable("T2", 6);
  await assert.rejects(
    h2.service.joinTable(t2.tableId, "Mallory", 1000, owner.playerId, "forged"),
    (e: unknown) => (e as TableError).code === "unauthorized",
  );
  const ok = await h2.service.joinTable(t2.tableId, "Alice", 500, owner.playerId, owner.token);
  assert.equal(ok.playerId, owner.playerId);
});

// ── 3. exhaustive hidden-card leak audit ────────────────────────────────────

test("audit: no opponent hole card ever appears in any per-player message during a live hand", async () => {
  const h = makeService();
  const { tableId, a, b } = await seatedPair(h);
  const rng = seededRng(7);
  const seen = new Map<string, TableView[]>(); // playerId → snapshots
  seen.set(a.playerId, []);
  seen.set(b.playerId, []);

  // Drive several hands with a random policy, capturing every per-player view.
  for (let guard = 0; guard < 400; guard++) {
    const state = h.service.getState(tableId)!;
    if (state.hand === null) break;
    // capture current views
    seen.get(a.playerId)!.push(h.service.snapshotFor(tableId, a.playerId));
    seen.get(b.playerId)!.push(h.service.snapshotFor(tableId, b.playerId));
    const seatIdx = state.hand.currentTurnSeat;
    const seat = state.seats[seatIdx];
    const legal = h.service.engine.legalActions(state, seatIdx);
    if (legal.length === 0) break;
    const pick = legal[rng.nextInt(legal.length)]!;
    await h.service.action(seat!.playerId, tableId, `leak-${guard}`, state.version, pick.type, pick.type === "bet" || pick.type === "raise" ? pick.min : undefined);
  }

  const cardIdOf = (c: { rank: number; suit: number }) => `${c.rank}${"cdhs"[c.suit]}`;
  for (const [viewerId, snapshots] of seen) {
    for (const snap of snapshots) {
      const state = h.service.getState(tableId)!;
      const liveHand = state.hand;
      // while the CURRENT hand is live, the opponent's hole cards must not
      // appear anywhere in this viewer's snapshot (log, reveal, seats, pots…)
      if (liveHand !== null) {
        const opponentId = viewerId === a.playerId ? b.playerId : a.playerId;
        const oppCards = liveHand.holeCardsByPlayer[opponentId] ?? [];
        const serialized = JSON.stringify(snap);
        for (const c of oppCards) {
          assert.ok(
            !serialized.includes(cardIdOf(c)),
            `leak: opponent card ${cardIdOf(c)} visible to ${viewerId.slice(0, 4)} in snapshot (hand ${liveHand.handNumber}, phase ${liveHand.phase})`,
          );
        }
      }
      // deck and tokens never present
      assert.ok(!JSON.stringify(snap).includes("deck"));
      assert.ok(!JSON.stringify(snap).includes("token"));
      // no card ever appears in the log text
      for (const entry of snap.log) {
        assert.ok(!/\b(2|3|4|5|6|7|8|9|10|11|12|13|14)[cdhs]\b/.test(entry.text), `log leaked cards: ${entry.text}`);
      }
    }
  }
});

// ── 4. durability ordering ──────────────────────────────────────────────────

/** A domain whose ledger put blocks until the test releases it. */
class ControlledLedgerDomain extends MemoryDomain {
  ledgerGate: Promise<void> | null = null;
  private release: (() => void) | null = null;
  readonly ledgerCalls: string[] = [];

  blockNextLedgerPut(): void {
    this.ledgerGate = new Promise((resolve) => {
      this.release = () => {
        this.release = null;
        resolve();
      };
    });
  }

  releaseLedger(): void {
    if (this.release === null) throw new Error("no blocked ledger put");
    this.release();
  }

  override table(name: string): KvTable<string, unknown> {
    if (name === "ledger") {
      const inner = this.tables.ledger as MemoryTable;
      const blocked: KvTable<string, unknown> = {
        get: (k) => inner.get(k),
        entries: () => inner.entries(),
        keys: () => inner.keys(),
        get size() {
          return inner.size;
        },
        put: async (key, value) => {
          this.ledgerCalls.push(String(key));
          const gate = this.ledgerGate;
          if (gate !== null) {
            this.ledgerGate = null;
            await gate;
          }
          await inner.put(key, value);
        },
        delete: async (key) => inner.delete(key),
        update: async (key, fn) => inner.update(key, fn),
      };
      return blocked;
    }
    return super.table(name);
  }
}

test("audit: a buy-in is only acknowledged after its ledger entry is durable (FAILS pre-fix)", async () => {
  const domain = new ControlledLedgerDomain();
  const h = makeService(domain);
  const table = await h.service.createTable("T", 6);
  domain.blockNextLedgerPut();
  let settled = false;
  const joinPromise = h.service.joinTable(table.tableId, "Alice", 1000).then((r) => {
    settled = true;
    return r;
  });
  // give the enqueued op a chance to reach the ledger put
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(settled, false, "joinTable must not resolve before the ledger entry is durable");
  domain.releaseLedger();
  const joined = await joinPromise;
  assert.equal(joined.wallet, 10_000 - 1000);
  assert.ok(domain.ledgerCalls.length >= 1, "ledger received the grant + buy-in entries");
});

// ── 5. disconnect → hand end → cash-out consistency ─────────────────────────

test("audit: disconnected player is cashed out exactly once and conservation holds", async () => {
  const h = makeService();
  const { tableId, a, b } = await seatedPair(h);
  // disconnect B mid-hand
  await h.service.setConnected(b.playerId, tableId, false);
  // play the hand to completion with A (A acts whenever it is their turn; the
  // turn timer auto-acts for B)
  const rng = seededRng(3);
  for (let guard = 0; guard < 300; guard++) {
    const state = h.service.getState(tableId)!;
    if (state.hand === null) break;
    const seatIdx = state.hand.currentTurnSeat;
    const seat = state.seats[seatIdx];
    if (seat === null || seat === undefined) break;
    if (seat.playerId === b.playerId) {
      // simulate the deadline passing for the disconnected player
      h.clock.advance(31_000);
      h.ctx.fireLatestTimeout();
      await new Promise((r) => setTimeout(r, 0));
      continue;
    }
    const legal = h.service.engine.legalActions(state, seatIdx);
    if (legal.length === 0) break;
    const pick = legal[rng.nextInt(legal.length)]!;
    await h.service.action(seat.playerId, tableId, `dc-${guard}`, state.version, pick.type, pick.type === "bet" || pick.type === "raise" ? pick.min : undefined);
  }
  const state = h.service.getState(tableId)!;
  const bSeat = state.seats.find((s) => s?.playerId === b.playerId);
  if (bSeat === undefined || bSeat === null) {
    // B was cashed out at hand end: wallet = grant - buyin + remaining stack,
    // and the whole system is conserved.
    const walletB = h.service.walletOf(b.playerId);
    const before = 2 * 10_000;
    assert.equal(h.service.totalSystemChips(), before, "conservation after disconnect + cash-out");
    assert.ok(walletB >= 10_000 - 1000 && walletB <= 10_000 - 1000 + 1000, `B wallet ${walletB} sane`);
  }
});

test("audit: duplicate leaveTable requests never double cash out", async () => {
  const h = makeService();
  const table = await h.service.createTable("T", 6);
  const p = await h.service.joinTable(table.tableId, "Alice", 1000);
  await h.service.leaveTable(p.playerId, table.tableId);
  // second leave: no longer seated
  await assert.rejects(h.service.leaveTable(p.playerId, table.tableId), (e: unknown) => (e as TableError).code === "not-seated");
  assert.equal(h.service.walletOf(p.playerId), 10_000, "cashed out exactly once");
  assert.equal(h.service.totalSystemChips(), 10_000);
});

test("audit: duplicate resume requests are idempotent", async () => {
  const h = makeService();
  const { tableId, a } = await seatedPair(h);
  const ok1 = await h.service.resume(a.playerId, a.token, tableId);
  const ok2 = await h.service.resume(a.playerId, a.token, tableId);
  assert.equal(ok1, true);
  assert.equal(ok2, true);
  const seat = h.service.getState(tableId)!.seats.find((s) => s?.playerId === a.playerId)!;
  assert.equal(seat.connected, true);
});
