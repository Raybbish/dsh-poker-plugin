import { test } from "node:test";
import assert from "node:assert/strict";
import { Ledger, LedgerError, LedgerEntry, walletDelta } from "../src/ledger.js";

function entry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    transactionId: "tx-1",
    playerId: "p1",
    tableId: "t1",
    handId: null,
    amount: 100,
    reason: "buy-in",
    createdAt: 1,
    ...overrides,
  };
}

test("ledger: idempotent by transactionId — second add is a no-op", () => {
  const ledger = new Ledger();
  assert.equal(ledger.add(entry()), true);
  assert.equal(ledger.add(entry()), false);
  assert.equal(ledger.size, 1);
  assert.equal(ledger.balanceOf("p1"), 100);
});

test("ledger: wallet balance derives from grant/buy-in/cash-out, never hand-result", () => {
  const ledger = new Ledger();
  ledger.add(entry({ transactionId: "grant", amount: 10000, reason: "grant", tableId: null }));
  ledger.add(entry({ transactionId: "buy", amount: -1000, reason: "buy-in" }));
  ledger.add(entry({ transactionId: "hand1", amount: 300, reason: "hand-result", handId: "h1" }));
  ledger.add(entry({ transactionId: "hand2", amount: -200, reason: "hand-result", handId: "h2" }));
  ledger.add(entry({ transactionId: "cash", amount: 700, reason: "cash-out" }));
  assert.equal(ledger.balanceOf("p1"), 10000 - 1000 + 700);
  // hand-results sum to zero here and are audit-only
  assert.equal(walletDelta(entry({ reason: "hand-result" })), 0);
});

test("ledger: rejects non-integer amounts", () => {
  const ledger = new Ledger();
  assert.throws(() => ledger.add(entry({ amount: 10.5 })), (e: unknown) => e instanceof LedgerError);
  assert.throws(() => ledger.rebuild([entry({ amount: 1.5 })]), (e: unknown) => e instanceof LedgerError);
});

test("ledger: rebuild from persisted entries restores balances", () => {
  const a = new Ledger();
  a.add(entry({ transactionId: "grant", amount: 10000, reason: "grant", tableId: null }));
  a.add(entry({ transactionId: "buy", amount: -1000, reason: "buy-in" }));
  const b = new Ledger();
  b.rebuild(a.all());
  assert.equal(b.balanceOf("p1"), 9000);
  assert.equal(b.size, 2);
});

test("ledger: entriesFor filters by player", () => {
  const ledger = new Ledger();
  ledger.add(entry({ playerId: "p1", transactionId: "a" }));
  ledger.add(entry({ playerId: "p2", transactionId: "b" }));
  assert.equal(ledger.entriesFor("p1").length, 1);
  assert.equal(ledger.entriesFor("p2").length, 1);
  assert.equal(ledger.balanceOf("p2"), 100);
});
