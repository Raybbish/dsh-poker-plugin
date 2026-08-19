import { test } from "node:test";
import assert from "node:assert/strict";

test("package: ./engine exposes the reusable poker engine surface", async () => {
  const engine = await import("dsh-poker/engine");

  assert.equal(typeof engine.PokerEngine, "function");
  assert.equal(typeof engine.seededRng, "function");
  assert.equal(typeof engine.evaluateBest, "function");
  assert.equal(typeof engine.buildDeck, "function");
  assert.equal(engine.DEFAULT_TABLE_CONFIG.bigBlind, 10);
});
