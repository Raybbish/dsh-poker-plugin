import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedWebSocketOrigin, isLocalBotConfigurationRequest } from "../src/host/gateway.js";
import { clientMessageSchema } from "../src/protocol.js";

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

test("gateway: AI keys can only be configured by a same-origin loopback browser", () => {
  assert.equal(isLocalBotConfigurationRequest("127.0.0.1", { host: "127.0.0.1:3080", origin: "http://127.0.0.1:3080" }), true);
  assert.equal(isLocalBotConfigurationRequest("::1", { host: "localhost:3080", origin: "http://localhost:3080" }), true);
  assert.equal(isLocalBotConfigurationRequest("::ffff:127.0.0.1", { host: "[::1]:3080", origin: "http://[::1]:3080" }), true);
  assert.equal(isLocalBotConfigurationRequest("192.168.1.50", { host: "127.0.0.1:3080", origin: "http://127.0.0.1:3080" }), false);
  assert.equal(isLocalBotConfigurationRequest("127.0.0.1", { host: "poker.example.com", origin: "https://poker.example.com" }), false);
  assert.equal(isLocalBotConfigurationRequest("127.0.0.1", { host: "localhost:3080" }), false, "non-browser clients cannot submit a key");
});

test("gateway: delete-table commands carry only a bounded room id", () => {
  assert.deepEqual(clientMessageSchema.parse({ type: "deleteTable", requestId: "r1", tableId: "t1" }), {
    type: "deleteTable",
    requestId: "r1",
    tableId: "t1",
  });
  assert.throws(() => clientMessageSchema.parse({ type: "deleteTable", requestId: "r1", tableId: "" }));
});
