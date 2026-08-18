import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedWebSocketOrigin } from "../src/host/gateway.js";

test("gateway: accepts same-origin browser WebSocket handshakes", () => {
  assert.equal(
    isAllowedWebSocketOrigin({ host: "127.0.0.1:3080", origin: "http://127.0.0.1:3080" }),
    true,
  );
  assert.equal(
    isAllowedWebSocketOrigin({ host: "LOCALHOST:3080", origin: "https://localhost:3080" }),
    true,
  );
});

test("gateway: rejects cross-origin and malformed browser handshakes", () => {
  assert.equal(
    isAllowedWebSocketOrigin({ host: "127.0.0.1:3080", origin: "https://attacker.example" }),
    false,
  );
  assert.equal(isAllowedWebSocketOrigin({ host: "127.0.0.1:3080", origin: "null" }), false);
  assert.equal(isAllowedWebSocketOrigin({ origin: "http://127.0.0.1:3080" }), false);
});

test("gateway: keeps non-browser clients without Origin working", () => {
  assert.equal(isAllowedWebSocketOrigin({ host: "127.0.0.1:3080" }), true);
});
