import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeRaiseTo, presetRaiseTo, type RaiseBounds } from "../src/client/raise-sizing.js";

const raising: RaiseBounds = {
  min: 20,
  max: 200,
  pot: 15,
  currentBet: 10,
  callAmount: 5,
  step: 1,
  raising: true,
};

test("raise sizing keeps exact integer input and clamps it to server bounds", () => {
  assert.equal(normalizeRaiseTo(23, raising), 23);
  assert.equal(normalizeRaiseTo(10, raising), 20);
  assert.equal(normalizeRaiseTo(999, raising), 200);
});

test("raise presets use post-call pot math and legal endpoints", () => {
  assert.equal(presetRaiseTo("min", raising), 20);
  assert.equal(presetRaiseTo("half-pot", raising), 20);
  assert.equal(presetRaiseTo("three-quarter-pot", raising), 25);
  assert.equal(presetRaiseTo("pot", raising), 30);
  assert.equal(presetRaiseTo("max", raising), 200);
});
