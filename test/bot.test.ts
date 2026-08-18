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
