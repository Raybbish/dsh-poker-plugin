/**
 * End-to-end smoke test against a real `dsh --profile <poker-profile>` server.
 *
 * Simulates two browser windows over WebSocket: creates a table, joins two
 * players, plays hands, verifies privacy (no opponent hole cards), stale
 * version rejection, reconnect/resume, and chip conservation.
 *
 * Usage: node scripts/smoke-test.mjs ws://127.0.0.1:3091/poker/ws
 */
import { WebSocket } from "ws";

const URL = process.argv[2] ?? "ws://127.0.0.1:3091/poker/ws";

class Client {
  constructor(label) {
    this.label = label;
    this.ws = new WebSocket(URL);
    this.pending = [];
    this.lobby = null;
    this.table = null;
    this.joined = null;
    this.wallet = null;
    this.errors = [];
    this.handCount = 0;
    this.commandSeq = 0;
    this.ws.on("message", (data) => this.onMessage(JSON.parse(data.toString())));
  }
  onMessage(msg) {
    if (msg.type === "lobby") this.lobby = msg.tables;
    if (msg.type === "snapshot") {
      if (this.table !== null && msg.table.handNumber > this.table.handNumber) this.handCount = msg.table.handNumber;
      this.table = msg.table;
      this.maybeAct();
    }
    if (msg.type === "joined") this.joined = msg;
    if (msg.type === "wallet") this.wallet = msg.balance;
    if (msg.type === "error") this.errors.push(msg);
  }
  send(msg) {
    this.ws.send(JSON.stringify(msg));
  }
  next() {
    return new Promise((resolve, reject) => {
      this.ws.once("error", reject);
      // resolve on the next snapshot, lobby, or error that arrives
      const timer = setTimeout(() => reject(new Error(`${this.label}: timeout waiting for response`)), 5000);
      const handler = () => { clearTimeout(timer); resolve(); };
      this.ws.once("message", handler);
    });
  }
  maybeAct() {
    const t = this.table;
    if (t === null || this.joined === null) return;
    const mine = t.myLegalActions;
    if (mine === undefined || mine.length === 0) return;
    const call = mine.find((a) => a.type === "call");
    const check = mine.find((a) => a.type === "check");
    const raise = mine.find((a) => a.type === "raise");
    let action = call ?? check ?? raise ?? mine[0];
    this.send({
      type: "action",
      commandId: `smoke-${this.label}-${++this.commandSeq}`,
      playerId: this.joined.playerId,
      tableId: t.tableId,
      expectedVersion: t.version,
      action: action.type,
      amount: action.type === "bet" || action.type === "raise" ? action.min : undefined,
    });
  }
  close() {
    this.ws.close();
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(predicate, what, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await sleep(100);
  }
  throw new Error(`timeout waiting for ${what}`);
}

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

function crossOriginHandshakeRejected() {
  return new Promise((resolve) => {
    const ws = new WebSocket(URL, { headers: { Origin: "https://attacker.example" } });
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      ws.terminate();
      finish(false);
    }, 3000);
    ws.once("unexpected-response", (_request, response) => {
      response.resume();
      finish(response.statusCode === 403);
    });
    ws.once("open", () => {
      ws.close();
      finish(false);
    });
    ws.once("error", () => {
      // A rejected upgrade may also surface as a socket error. The
      // unexpected-response event above owns the authoritative status check.
    });
  });
}

async function main() {
  check("cross-origin WebSocket handshake rejected", await crossOriginHandshakeRejected());

  const a = new Client("A");
  const b = new Client("B");
  await Promise.all([a.next(), b.next()]);

  // 1. lobby after createTable (unique name so stale persisted tables don't collide)
  const tableName = `Smoke-${Date.now()}`;
  a.send({ type: "createTable", requestId: "r1", name: tableName, maxSeats: 6 });
  await a.next();
  await waitFor(() => a.lobby !== null && a.lobby.some((t) => t.name === tableName), "table in lobby");
  const table = a.lobby.find((t) => t.name === tableName);
  check("lobby lists the created table", table !== undefined);

  // 2. two players join
  a.send({ type: "joinTable", requestId: "r2", tableId: table.tableId, nickname: "Alice", buyIn: 1000 });
  await a.next();
  await waitFor(() => a.joined !== null && a.table !== null, "A joined + snapshot");
  check("A joined with playerId/token", a.joined !== null && typeof a.joined.token === "string" && a.joined.token.length > 10);
  check("A wallet debited by buy-in", a.wallet === 10000 - 1000);

  b.send({ type: "joinTable", requestId: "r3", tableId: table.tableId, nickname: "Bob", buyIn: 1000 });
  await b.next();
  await waitFor(() => b.joined !== null && b.table !== null && b.table.phase !== "idle", "B joined + hand started");
  check("hand started with two players", b.table !== null && b.table.phase !== "idle");

  // 3. privacy: A must never see B's hole cards (checked on a mid-hand snapshot)
  await waitFor(() => a.table !== null && a.table.phase !== "idle", "A mid-hand snapshot");
  check("A snapshot hides B's hole cards", a.table.seats.every((s) => s.playerId === "" || s.playerId === a.joined.playerId || s.holeCards === undefined));
  check("B snapshot hides A's hole cards", b.table.seats.every((s) => s.playerId === "" || s.playerId === b.joined.playerId || s.holeCards === undefined));
  check("A sees its own hole cards", a.table.seats.find((s) => s.playerId === a.joined.playerId)?.holeCards?.length === 2);
  check("no tokens or deck in snapshots", !JSON.stringify(a.table).includes("token") && !JSON.stringify(a.table).includes("deck"));

  // 4. play hands until at least two hands have started (first one completed)
  const playUntil = async (clients) => {
    for (let i = 0; i < 300; i++) {
      if (clients.some((c) => c.handCount >= 2)) return true;
      // rebuy broke players so the game can continue
      for (const c of clients) {
        const t = c.table;
        if (t === null || t.phase !== "idle") continue;
        const broke = t.seats.find((s) => s.playerId !== "" && s.stack === 0 && s.playerId === (c.joined?.playerId ?? ""));
        if (broke !== undefined) {
          c.send({ type: "leaveTable", requestId: `rb-${c.label}-${i}`, tableId: t.tableId });
          await sleep(150);
          c.send({
            type: "joinTable",
            requestId: `rb2-${c.label}-${i}`,
            tableId: t.tableId,
            nickname: c.label === "A" ? "Alice" : "Bob",
            buyIn: 1000,
            playerId: c.joined.playerId,
            token: c.joined.token,
          });
          await sleep(150);
        }
      }
      await sleep(150);
    }
    return false;
  };
  const played = await playUntil([a, b]);
  check("at least one hand completed", played, `handCount A=${a.handCount} B=${b.handCount}`);
  await sleep(300);

  // 5. conservation: stacks + pots across the table stay at 2 * buy-in
  const escrow = (t) => t.seats.reduce((s, x) => s + (x.playerId !== "" ? x.stack : 0), 0) + t.pots.reduce((s, p) => s + p.amount, 0);
  const sumA = escrow(a.table);
  const sumB = escrow(b.table);
  check("chip conservation on the table (stacks + pots = 2000)", sumA === 2000 && sumB === 2000, `A:${sumA} B:${sumB}`);

  // 6. stale version rejection
  const staleErr = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "error" && msg.code === "stale-version") resolve(msg);
    };
    a.ws.on("message", handler);
    setTimeout(() => resolve(null), 2000);
    a.send({
      type: "action",
      commandId: "smoke-stale-1",
      playerId: a.joined.playerId,
      tableId: table.tableId,
      expectedVersion: 0, // definitely stale
      action: "fold",
    });
  });
  const stale = await staleErr;
  check("stale expectedVersion is rejected", stale !== null);

  // 7. reconnect + resume restores the seat
  a.ws.close();
  await sleep(400);
  const a2 = new Client("A2");
  await a2.next();
  a2.send({
    type: "resume",
    requestId: "r9",
    playerId: a.joined.playerId,
    token: a.joined.token,
    tableId: table.tableId,
  });
  await a2.next();
  await waitFor(() => a2.table !== null && a2.table.tableId === table.tableId, "A reconnects and gets a snapshot");
  const me = a2.table.seats.find((s) => s.playerId === a.joined.playerId);
  check("resume restores the seat", me !== undefined && me.nickname === "Alice");
  check("resume marks the seat connected", me !== undefined && me.connected === true);

  // 8. wrong token is rejected
  a2.send({ type: "resume", requestId: "r10", playerId: a.joined.playerId, token: "forged", tableId: table.tableId });
  await sleep(300);
  check("forged token rejected", a2.errors.some((e) => e.code === "resume-failed"));

  // 8c. spectating: a connection that never joins can subscribe to a table's
  // public snapshots; the view has no seat and no hole cards.
  const spectator = new Client("Spec");
  await spectator.next();
  spectator.send({ type: "requestSnapshot", requestId: "sp1", tableId: table.tableId });
  await sleep(300);
  const specTable = spectator.table;
  check("spectator receives the table snapshot", specTable !== null && specTable.tableId === table.tableId);
  if (specTable !== null) {
    check("spectator has no seat", specTable.mySeat === null);
    check("spectator view has no hole cards", specTable.myHoleCards === null && specTable.seats.every((s) => s.holeCards === undefined));
  }
  spectator.close();
  // 8b. gateway-level authorization: an unauthenticated socket cannot act,
  // a socket cannot act as another player, and a forged identity cannot spend
  // a victim's wallet at another table.
  const mallory = new Client("Mallory");
  await mallory.next();
  // (i) unauthenticated action
  mallory.send({ type: "action", commandId: "m1", playerId: b.joined.playerId, tableId: table.tableId, expectedVersion: 0, action: "fold" });
  await sleep(250);
  check("unauthenticated action rejected", mallory.errors.some((e) => e.code === "unauthorized"));
  mallory.errors = [];
  // (ii) join as Bob with a forged token at another table
  const other = await (async () => {
    mallory.send({ type: "createTable", requestId: "m2", name: "MalloryTable", maxSeats: 6 });
    await sleep(300);
    return mallory.lobby.find((t) => t.name === "MalloryTable");
  })();
  check("mallory created her own table", other !== undefined);
  mallory.send({ type: "joinTable", requestId: "m3", tableId: other.tableId, nickname: "Mallory", buyIn: 1000, playerId: b.joined.playerId, token: "forged-token" });
  await sleep(300);
  check("forged identity rejected by joinTable", mallory.errors.some((e) => e.code === "unauthorized"));
  mallory.close();

  // 9. leaveTable — a mid-hand leave cashes out when the hand ends; drive the
  // game to completion and wait for the wallet push. Conservation: A's wallet
  // after cash-out + Bob's table escrow = 11000 (Alice's 10k grant minus Bob's
  // buy-in never leaves the system).
  a2.send({ type: "leaveTable", requestId: "r11", tableId: table.tableId });
  await waitFor(() => a2.lobby !== null, "lobby after leave");
  const escrowOf = (t) => (t === null ? 0 : t.seats.reduce((s, x) => s + (x.playerId !== "" ? x.stack : 0), 0) + t.pots.reduce((s, p) => s + p.amount, 0));
  const leaveDeadline = Date.now() + 40_000;
  let lastEscrowB = 0;
  while (Date.now() < leaveDeadline) {
    const escrowB = escrowOf(b.table);
    lastEscrowB = escrowB;
    if (a2.wallet !== null && a2.wallet + escrowB === 11000) break;
    const t = b.table;
    if (t !== null && b.joined !== null) {
      const opts = t.myLegalActions;
      if (opts !== undefined && opts.length > 0) {
        const opt = opts.find((o) => o.type === "check") ?? opts.find((o) => o.type === "call") ?? opts[0];
        b.send({
          type: "action",
          commandId: `finish-${++b.commandSeq}`,
          playerId: b.joined.playerId,
          tableId: t.tableId,
          expectedVersion: t.version,
          action: opt.type,
          amount: opt.type === "bet" || opt.type === "raise" ? opt.min : undefined,
        });
      }
    }
    await sleep(300);
  }
  check(
    "cash-out returns chips to the wallet (incl. delayed mid-hand leave)",
    a2.wallet !== null && a2.wallet + lastEscrowB === 11000,
    `wallet=${a2.wallet} escrow(B)=${lastEscrowB} sum=${a2.wallet === null ? "null" : a2.wallet + lastEscrowB}`,
  );

  a.close();
  a2.close();
  b.close();

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error("SMOKE TEST ERROR:", err.message);
  process.exit(1);
});
