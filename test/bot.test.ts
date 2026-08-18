import { test } from "node:test";
import assert from "node:assert/strict";
import { BotController, DeepSeekDecisionProvider, chooseBotAction, type BotDecisionProvider } from "../src/host/bot-controller.js";
import { TableError, TableService } from "../src/host/table-service.js";
import { MemoryDomain, FakeCtx } from "./helpers.js";
import type { TableView } from "../src/protocol.js";

function makeService(): { service: TableService; ctx: FakeCtx } {
  const ctx = new FakeCtx();
  const service = new TableService(ctx as never, new MemoryDomain() as never);
  return { service, ctx };
}

test("bot: only a seated player can add a connected AI seat", async () => {
  const { service } = makeService();
  const table = await service.createTable("AI table", 3);
  const human = await service.joinTable(table.tableId, "Human", 1000);
  await service.setConnected(human.playerId, table.tableId, true);

  await assert.rejects(
    service.addBot(table.tableId, "not-seated", "AI Player"),
    (error: unknown) => error instanceof TableError && error.code === "unauthorized",
  );

  const bot = await service.addBot(table.tableId, human.playerId, "AI Player");
  const state = service.getState(table.tableId)!;
  const seat = state.seats.find((candidate) => candidate?.playerId === bot.playerId);
  assert.equal(seat?.isBot, true);
  assert.equal(seat?.connected, true);
  assert.ok(state.hand !== null, "human + bot starts a hand immediately");
  assert.equal(service.snapshotFor(table.tableId, human.playerId).seats.find((candidate) => candidate.playerId === bot.playerId)?.isBot, true);
});

test("bot: a human can fill the remaining seats with uniquely named AI players after play starts", async () => {
  const { service } = makeService();
  const table = await service.createTable("AI ring", 4);
  const human = await service.joinTable(table.tableId, "Human", 1000);
  await service.setConnected(human.playerId, table.tableId, true);

  await Promise.all([
    service.addBot(table.tableId, human.playerId),
    service.addBot(table.tableId, human.playerId),
    service.addBot(table.tableId, human.playerId),
  ]);

  const state = service.getState(table.tableId)!;
  const bots = state.seats.filter((seat) => seat?.isBot === true);
  assert.equal(bots.length, 3);
  assert.deepEqual(bots.map((seat) => seat!.nickname), ["AI Player", "AI Player 2", "AI Player 3"]);
  assert.ok(state.hand !== null, "additional bots can be seated while the first hand is running");
  await assert.rejects(
    service.addBot(table.tableId, human.playerId),
    (error: unknown) => error instanceof TableError && error.code === "table-full",
  );
});

test("bot: a table with no connected human pauses timers and makes no AI request", async () => {
  const { service, ctx } = makeService();
  const table = await service.createTable("AI pause", 4);
  const human = await service.joinTable(table.tableId, "Human", 1000);
  await service.setConnected(human.playerId, table.tableId, true);
  await service.addBot(table.tableId, human.playerId);
  await service.addBot(table.tableId, human.playerId);

  await service.leaveTable(human.playerId, table.tableId);
  assert.equal(service.getState(table.tableId)?.hand, null, "an AI-only next hand must not start");
  assert.equal(ctx.pendingTimeoutCount, 0, "the turn deadline is paused when the last human leaves");

  let decisions = 0;
  const provider: BotDecisionProvider = {
    async decide() {
      decisions += 1;
      return { action: "fold" };
    },
  };
  const controller = new BotController(service, provider, {
    decisionDelayMs: 0,
    schedule: (callback) => {
      queueMicrotask(callback);
      return () => {};
    },
  });
  controller.start();
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  controller.dispose();
  assert.equal(decisions, 0, "AI-vs-AI play must not consume API calls without a human");

  const returningHuman = await service.joinTable(table.tableId, "Returning Human", 1000);
  await service.setConnected(returningHuman.playerId, table.tableId, true);
  assert.ok(service.getState(table.tableId)?.hand !== null, "a connected human resumes the table");
  assert.equal(ctx.pendingTimeoutCount, 1, "the turn deadline resumes with the human");
});

test("bot: leaving last human settles the hand, frees the seat and returns the lobby to idle", async () => {
  const { service, ctx } = makeService();
  const table = await service.createTable("Paused lobby", 4);
  const human = await service.joinTable(table.tableId, "Human", 1000);
  await service.addBot(table.tableId, human.playerId);
  await service.addBot(table.tableId, human.playerId);
  await service.addBot(table.tableId, human.playerId);
  await service.setConnected(human.playerId, table.tableId, true);
  assert.ok(service.getState(table.tableId)?.hand !== null, "all four players start a hand");

  await service.leaveTable(human.playerId, table.tableId);
  const state = service.getState(table.tableId)!;
  assert.equal(state.hand, null, "an intentionally abandoned AI-only hand is settled");
  assert.equal(state.seats.some((seat) => seat?.playerId === human.playerId), false, "the leaving human seat is freed");
  assert.equal(state.seats.filter((seat) => seat?.isBot === true).length, 3, "bots remain seated for a future human");
  assert.equal(ctx.pendingTimeoutCount, 0, "no AI-only deadline remains");
  assert.equal(service.lobbyView().find((entry) => entry.tableId === table.tableId)?.status, "idle");
});

test("bot: an interrupted hand is labelled paused when its human disconnects without leaving", async () => {
  const { service, ctx } = makeService();
  const table = await service.createTable("Disconnected lobby", 3);
  const human = await service.joinTable(table.tableId, "Human", 1000);
  await service.addBot(table.tableId, human.playerId);
  await service.addBot(table.tableId, human.playerId);
  await service.setConnected(human.playerId, table.tableId, true);

  await service.setConnected(human.playerId, table.tableId, false);
  assert.ok(service.getState(table.tableId)?.hand !== null, "a disconnected human can resume the hand");
  assert.equal(ctx.pendingTimeoutCount, 0, "the disconnected table is frozen");
  assert.equal(service.lobbyView().find((entry) => entry.tableId === table.tableId)?.status, "paused");
});

test("bot: a disconnected human remains resumable when another human leaves, including after restart", async () => {
  const domain = new MemoryDomain();
  const firstCtx = new FakeCtx();
  const first = new TableService(firstCtx as never, domain as never);
  const table = await first.createTable("Resumable human", 3);
  const leaving = await first.joinTable(table.tableId, "Leaving Human", 1000);
  const resumable = await first.joinTable(table.tableId, "Resumable Human", 1000);
  await first.setConnected(leaving.playerId, table.tableId, true);
  await first.setConnected(resumable.playerId, table.tableId, true);
  await first.addBot(table.tableId, leaving.playerId);

  // The first hand started before the bot joined. Fold its current actor so
  // the next hand includes both humans and the bot.
  const firstHand = first.getState(table.tableId)!;
  const firstActor = firstHand.seats[firstHand.hand!.currentTurnSeat]!;
  await first.action(firstActor.playerId, table.tableId, "finish-setup-hand", firstHand.version, "fold");
  assert.equal(first.getState(table.tableId)?.hand?.players.length, 3);

  await first.setConnected(resumable.playerId, table.tableId, false);
  await first.leaveTable(leaving.playerId, table.tableId);
  assert.ok(first.getState(table.tableId)?.hand !== null, "the disconnected human keeps the hand resumable");
  first.dispose();

  const restarted = new TableService(new FakeCtx() as never, domain as never);
  await restarted.init();
  const restored = restarted.getState(table.tableId)!;
  assert.ok(restored.hand !== null, "restart does not settle a hand with a resumable human");
  assert.equal(restored.seats.some((seat) => seat?.playerId === resumable.playerId), true);
  assert.equal(restarted.lobbyView().find((entry) => entry.tableId === table.tableId)?.status, "paused");
});

test("bot: proposed DeepSeek action is clamped to the engine's legal actions", () => {
  const view = {
    myLegalActions: [
      { type: "fold" },
      { type: "call", amount: 15 },
      { type: "raise", min: 30, max: 100 },
    ],
  } as unknown as TableView;

  assert.deepEqual(chooseBotAction(view, { action: "raise", amount: 999 }), { action: "raise", amount: 100 });
  assert.deepEqual(chooseBotAction(view, { action: "check" }), { action: "call" });
});

test("bot: DeepSeek adapter sends server-side JSON mode request", async () => {
  let requestUrl = "";
  let requestInit: { headers?: Record<string, string>; body?: string } | undefined;
  const fetcher = async (url: string, init: { headers?: Record<string, string>; body?: string }) => {
    requestUrl = url;
    requestInit = init;
    return {
      ok: true,
      status: 200,
      async json() {
        return { choices: [{ message: { content: '{"action":"raise","amount":73}' } }] };
      },
    };
  };
  const provider = new DeepSeekDecisionProvider({ apiKey: "secret-test-key", fetcher: fetcher as never });
  const view = {
    tableId: "t1",
    phase: "flop",
    version: 7,
    handNumber: 2,
    mySeat: 1,
    myHoleCards: [{ rank: 14, suit: 3 }, { rank: 14, suit: 2 }],
    community: [{ rank: 2, suit: 0 }, { rank: 7, suit: 1 }, { rank: 9, suit: 3 }],
    pots: [{ amount: 45, eligiblePlayerIds: ["human", "bot"] }],
    toCall: 10,
    minRaise: 20,
    seats: [
      { nickname: "Human", playerId: "human", stack: 900, bet: 10, folded: false, allIn: false, lastAction: null },
      { nickname: "AI Player", playerId: "bot", stack: 910, bet: 20, folded: false, allIn: false, lastAction: null },
    ],
    myLegalActions: [{ type: "raise", min: 30, max: 100 }],
    log: [],
  } as unknown as TableView;

  assert.deepEqual(await provider.decide(view), { action: "raise", amount: 73 });
  assert.equal(requestUrl, "https://api.deepseek.com/chat/completions");
  assert.equal(requestInit?.headers?.Authorization, "Bearer secret-test-key");
  const body = JSON.parse(requestInit?.body ?? "{}");
  assert.equal(body.model, "deepseek-v4-flash");
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.equal(body.thinking.type, "disabled");
});

test("bot: controller acts from the bot-private view and never stalls on a legal turn", async () => {
  const { service } = makeService();
  const table = await service.createTable("AI table", 2);
  const human = await service.joinTable(table.tableId, "Human", 1000);
  await service.setConnected(human.playerId, table.tableId, true);
  const seen: TableView[] = [];
  const provider: BotDecisionProvider = {
    async decide(view) {
      seen.push(view);
      return { action: "fold" };
    },
  };
  const controller = new BotController(service, provider, {
    decisionDelayMs: 0,
    schedule: (callback) => {
      queueMicrotask(callback);
      return () => {};
    },
  });
  controller.start();
  const bot = await controller.addBot(table.tableId, human.playerId);

  // Heads-up starts with the first human acting. Advance once so the bot gets
  // a turn; if seat order changes, the controller simply acts immediately.
  const state = service.getState(table.tableId)!;
  if (state.hand?.currentTurnSeat === state.seats.findIndex((seat) => seat?.playerId === human.playerId)) {
    const legal = service.snapshotFor(table.tableId, human.playerId).myLegalActions;
    const action = legal.find((candidate) => candidate.type === "call") ?? legal.find((candidate) => candidate.type === "check") ?? legal[0]!;
    await service.action(human.playerId, table.tableId, "human-opener", state.version, action.type, action.amount);
  }

  for (let i = 0; i < 20 && seen.length === 0; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  controller.dispose();
  assert.ok(seen.length >= 1, "the decision provider was called");
  const botView = seen[0]!;
  assert.equal(botView.mySeat, service.getState(table.tableId)!.seats.findIndex((seat) => seat?.playerId === bot.playerId));
  assert.ok(botView.myHoleCards?.length === 2, "bot sees its own cards");
  assert.ok(botView.seats.filter((seat) => seat.playerId !== bot.playerId).every((seat) => seat.holeCards === undefined), "bot never sees opponent cards");
});
