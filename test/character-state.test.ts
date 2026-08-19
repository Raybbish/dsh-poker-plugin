import { test } from "node:test";
import assert from "node:assert/strict";
import { characterStateForSeat } from "../src/client/characters.js";
import type { SeatView } from "../src/client/view-types.js";

function bot(overrides: Partial<SeatView> = {}): SeatView {
  return {
    seat: 1,
    playerId: "bot-1",
    nickname: "AI Player",
    stack: 900,
    bet: 0,
    folded: false,
    allIn: false,
    connected: true,
    isBot: true,
    isDealer: false,
    isSmallBlind: false,
    isBigBlind: false,
    isTurn: false,
    isMe: false,
    excluded: false,
    lastAction: null,
    ...overrides,
  };
}

test("character state follows the table story without influencing strategy", () => {
  assert.equal(characterStateForSeat(bot(), "idle", false), "idle");
  assert.equal(characterStateForSeat(bot(), "flop", false), "observing");
  assert.equal(characterStateForSeat(bot({ isTurn: true }), "flop", false), "thinking");
  assert.equal(characterStateForSeat(bot({ bet: 40, lastAction: { type: "raise", amount: 30 } }), "flop", false), "acting");
  assert.equal(characterStateForSeat(bot(), "showdown", true), "reacting");
  assert.equal(characterStateForSeat(bot({ folded: true }), "turn", false), "idle");
});
