/**
 * Frontend tests — render the actual browser bundle components with
 * react-dom/server (hooks supported server-side; effects do not run).
 *
 * The bundle is materialized through the same `__ModuleLoader__` handoff the
 * harness browser uses, with `react` resolved from the platform seed word.
 * Covers: loading / empty / reconnecting / spectating / error states, the
 * table states (my turn, waiting, showdown), seat geometry at all widths, and
 * the "no font shrinking to fix layout" CSS guard.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

// ── materialize the browser bundle (same protocol as the web shell) ─────────
(globalThis as unknown as { window?: Record<string, unknown> }).window = {};
const factories = new Map<string, (req: (spec: string) => unknown) => unknown>();
(globalThis as unknown as { window: Record<string, unknown> }).window.__ModuleLoader__ = {
  load: (entry: { id: string; factory: (req: (spec: string) => unknown) => unknown }) => {
    factories.set(entry.id, entry.factory);
  },
};

interface TestExports {
  Store: Record<string, unknown> & { set(patch: Record<string, unknown>): void };
  CardView: (p: Record<string, unknown>) => React.ReactNode;
  SeatView: (p: Record<string, unknown>) => React.ReactNode;
  LobbyView: () => React.ReactNode;
  TableView: () => React.ReactNode;
  PokerOverlay: () => React.ReactNode;
  PokerCenterButton: (p: Record<string, unknown>) => React.ReactNode;
  setLocale: (locale: "zh" | "en") => void;
  translateLog: (text: string, locale: "zh" | "en") => string;
  translateError: (text: string, locale: "zh" | "en") => string;
  translateHandLabel: (text: string, locale: "zh" | "en") => string;
  seatPositions: (seats: number[], viewerSeat: number | null, compact: boolean) => { left: number; top: number }[];
  seatPositionsPx: (seats: number[], viewerSeat: number | null, compact: boolean, w: number, h: number) => { left: number; top: number }[];
  seatBoxes: (centers: { left: number; top: number }[], w: number, h: number) => { left: number; top: number; right: number; bottom: number }[];
  CSS: string;
}

let __test: TestExports;

test.before(async () => {
  // The built artifact is exactly what the harness serves at
  // /plugins/dsh-poker/client.js — test that file, not a copy.
  await import("../../lib/client.js");
  const factory = factories.get("dsh-poker");
  assert.ok(factory, "bundle registered its factory");
  const mod = factory!((spec) => {
    if (spec === "react") return React;
    throw new Error(`unexpected require: ${spec}`);
  }) as unknown as { __test: TestExports };
  __test = mod.__test;
});

function render(node: unknown): string {
  return renderToStaticMarkup(node as React.ReactElement);
}

function seat(playerId: string, nickname: string, stack: number, extra: Record<string, unknown> = {}) {
  return { seat: 0, playerId, nickname, stack, bet: 0, folded: false, allIn: false, connected: true, isBot: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: false, holeCards: undefined, ...extra };
}

function fixtureTable(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    tableId: "t1",
    name: "Test Table",
    version: 5,
    handNumber: 3,
    maxSeats: 6,
    smallBlind: 5,
    bigBlind: 10,
    buyIn: 1000,
    phase: "flop",
    dealerSeat: 0,
    seats: [
      seat("p1", "Alice", 950, { seat: 1, isSmallBlind: true }),
      seat("p2", "Bob", 900, { seat: 2, isBigBlind: true }),
      seat("p3", "Carol", 1000, { seat: 3, isMe: true, holeCards: [{ rank: 14, suit: 2 }, { rank: 10, suit: 1 }] }),
      { seat: 0, playerId: "", nickname: "", stack: 0, bet: 0, folded: false, allIn: false, connected: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: true },
      { seat: 4, playerId: "", nickname: "", stack: 0, bet: 0, folded: false, allIn: false, connected: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: true },
      { seat: 5, playerId: "", nickname: "", stack: 0, bet: 0, folded: false, allIn: false, connected: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: true },
    ],
    community: [
      { rank: 13, suit: 0 },
      { rank: 8, suit: 2 },
      { rank: 2, suit: 1 },
    ],
    pots: [{ amount: 60, eligiblePlayerIds: ["p1", "p2", "p3"] }],
    toCall: 10,
    minRaise: 10,
    currentTurnSeat: 3,
    actionDeadlineAt: 0,
    mySeat: 3,
    myHoleCards: [
      { rank: 14, suit: 2 },
      { rank: 10, suit: 1 },
    ],
    myLegalActions: [
      { type: "fold" },
      { type: "call", amount: 10 },
      { type: "allin" },
    ],
    log: [{ at: 1_700_000_000_000, text: "Hand #3 started." }],
    reveal: [],
    winners: [],
    startedAt: 0,
    ...overrides,
  };
}

function setStore(patch: Record<string, unknown>): void {
  __test.Store.set({ locale: "zh", open: false, connected: true, connecting: false, session: null, lobby: [], table: null, spectateTableId: null, wallet: 9000, error: null, ...patch });
}

// ── lobby states ─────────────────────────────────────────────────────────────

test("lobby: loading state while connecting", () => {
  setStore({ connecting: true });
  const html = render(React.createElement(__test.LobbyView));
  assert.match(html, /hp-spinner/);
  assert.match(html, /正在连接游戏服务器/);
});

test("lobby: empty state when no tables exist", () => {
  setStore({ connecting: false, lobby: [] });
  const html = render(React.createElement(__test.LobbyView));
  assert.match(html, /暂时没有牌桌/);
  assert.match(html, /创建牌桌/);
  assert.match(html, /游戏筹码/);
  assert.match(html, /<option value="10">10<\/option>/);
});

test("lobby: table list renders rows with Join and Watch buttons", () => {
  setStore({
    lobby: [
      { tableId: "t1", name: "Friday", maxSeats: 6, playerCount: 2, status: "playing", smallBlind: 5, bigBlind: 10, buyIn: 1000, createdAt: 0 },
      { tableId: "t2", name: "Full House", maxSeats: 2, playerCount: 2, status: "playing", smallBlind: 5, bigBlind: 10, buyIn: 1000, createdAt: 1 },
      { tableId: "t3", name: "Paused Table", maxSeats: 10, playerCount: 9, status: "paused", smallBlind: 5, bigBlind: 10, buyIn: 1000, createdAt: 2 },
    ],
  });
  const html = render(React.createElement(__test.LobbyView));
  assert.match(html, /Friday/);
  assert.match(html, /Full House/);
  assert.match(html, /加入/);
  assert.match(html, /观战/); // full tables offer spectating
  assert.match(html, /已暂停/);
});

// ── overlay / error / reconnecting ───────────────────────────────────────────

test("overlay: error toast is shown", () => {
  setStore({ open: true, error: "stale-version: please retry" });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /牌局状态已更新，请重试/);
  assert.match(html, /hp-toast/);
});

test("overlay: reconnecting banner appears on the table when the socket drops", () => {
  setStore({ open: true, connected: false, session: { playerId: "p3", token: "x", tableId: "t1", nickname: "Carol" }, table: fixtureTable() });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /连接已断开，正在重新连接/);
});

test("overlay: shows the lobby when not seated and not watching", () => {
  setStore({ open: true, table: null, spectateTableId: null });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /创建牌桌/);
});

// ── table states ─────────────────────────────────────────────────────────────

test("table: my turn shows call/fold/all-in actions with amounts", () => {
  setStore({ open: true, session: { playerId: "p3", token: "x", tableId: "t1", nickname: "Carol" }, table: fixtureTable() });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /跟注 10/);
  assert.match(html, /弃牌/);
  assert.match(html, /全下/);
  assert.match(html, /Carol（你）/);
  // own hole cards rendered, opponent hole cards are backs only
  assert.match(html, /A/); // ace of hearts label
  const backCount = (html.match(/hp-card (?:small )?back/g) || []).length;
  assert.equal(backCount, 4, "two opponents × two card backs");
});

test("table: opponent bets and community cards render", () => {
  const t = fixtureTable({
    seats: [
      seat("p1", "Alice", 950, { seat: 1, bet: 20 }),
      seat("p2", "Bob", 900, { seat: 2 }),
      seat("p3", "Carol", 1000, { seat: 3 }),
      seat("p4", "Dave", 980, { seat: 4, folded: true }),
      { seat: 0, playerId: "", nickname: "", stack: 0, bet: 0, folded: false, allIn: false, connected: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: true },
      { seat: 5, playerId: "", nickname: "", stack: 0, bet: 0, folded: false, allIn: false, connected: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: true },
    ],
  });
  setStore({ open: true, session: { playerId: "p3", token: "x", tableId: "t1", nickname: "Carol" }, table: t });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /下注 20/);
  assert.match(html, /底池 60/);
  assert.match(html, /已弃牌/);
  assert.match(html, /K/); // king of clubs on the board
});

test("table: spectating state — no own cards, join prompt, no action buttons", () => {
  setStore({
    open: true,
    spectateTableId: "t1",
    session: null,
    table: fixtureTable({
      mySeat: null,
      myHoleCards: null,
      myLegalActions: [],
      // a spectator view carries no hole cards anywhere
      seats: [
        seat("p1", "Alice", 950, { seat: 1 }),
        seat("p2", "Bob", 900, { seat: 2 }),
        seat("p3", "Carol", 1000, { seat: 3, isMe: false }),
        { seat: 0, playerId: "", nickname: "", stack: 0, bet: 0, folded: false, allIn: false, connected: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: true },
        { seat: 4, playerId: "", nickname: "", stack: 0, bet: 0, folded: false, allIn: false, connected: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: true },
        { seat: 5, playerId: "", nickname: "", stack: 0, bet: 0, folded: false, allIn: false, connected: false, isDealer: false, isSmallBlind: false, isBigBlind: false, isTurn: false, isMe: false, excluded: true },
      ],
    }),
  });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /正在观战/);
  assert.match(html, /加入牌桌/);
  assert.match(html, /返回大厅/);
  assert.doesNotMatch(html, /跟注 10/);
  // all three occupied seats render as backs (no one is "me")
  const backCount = (html.match(/hp-card (?:small )?back/g) || []).length;
  assert.equal(backCount, 6);
});

test("table: waiting state when no hand runs", () => {
  setStore({ open: true, session: { playerId: "p1", token: "x", tableId: "t1", nickname: "Alice" }, table: fixtureTable({ phase: "idle", community: [], currentTurnSeat: -1, actionDeadlineAt: 0, myLegalActions: [], mySeat: 1 }) });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /等待玩家入座/);
  assert.match(html, /复制房间 ID 邀请朋友/);
  assert.match(html, /加入机器人/);
  assert.match(html, /data-testid="add-bot"/);
});

test("table: AI-controlled seats carry an AI badge", () => {
  const table = fixtureTable({
    seats: [
      seat("p1", "AI Player", 950, { seat: 1, isBot: true }),
      seat("p2", "Human", 1000, { seat: 2, isMe: true, holeCards: [{ rank: 14, suit: 2 }, { rank: 10, suit: 1 }] }),
    ],
  });
  setStore({ open: true, session: { playerId: "p2", token: "x", tableId: "t1", nickname: "Human" }, table });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /hp-ai-badge/);
  assert.match(html, />机器人</);
  assert.match(html, /机器人<\/div>/);
});

test("table: another AI bot can be added while a hand is running", () => {
  setStore({ open: true, session: { playerId: "p2", token: "x", tableId: "t1", nickname: "Human" }, table: fixtureTable({ mySeat: 1 }) });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /data-testid="add-bot-active"/);
  assert.match(html, /＋ 机器人 · 3\/6/);
  assert.match(html, /机器人将在下一手牌加入/);
});

test("table: showdown result banner shows winners and revealed hands", () => {
  setStore({
    open: true,
    session: { playerId: "p1", token: "x", tableId: "t1", nickname: "Alice" },
    table: fixtureTable({
      winners: [{ playerId: "p2", nickname: "Bob", amount: 120, handLabel: "Full House, Ks over 8s" }],
      reveal: [{ playerId: "p2", nickname: "Bob", cards: ["13s", "8h"], handLabel: "Full House, Ks over 8s" }],
      mySeat: 1,
    }),
  });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /Bob 赢得 120/);
  assert.match(html, /摊牌：/);
  assert.match(html, /K 葫芦/);
  assert.match(html, /hp-showdown/);
});

// ── sidebar entry ────────────────────────────────────────────────────────────

test("sidebar: entry shows label when wide and status dot reflects connection", () => {
  setStore({ connected: true });
  const wideHtml = render(React.createElement(__test.PokerCenterButton, { wide: true }));
  assert.match(wideHtml, /德州扑克/);
  assert.match(wideHtml, /hp-statusdot on/);
  const railHtml = render(React.createElement(__test.PokerCenterButton, { wide: false }));
  assert.doesNotMatch(railHtml, /class="plabel"/);
});

// ── complete language modes ────────────────────────────────────────────────

test("language: English mode switches the complete lobby and header", () => {
  setStore({ locale: "en", open: true, lobby: [] });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /Game Center/);
  assert.match(html, /Texas Hold&#x27;em/);
  assert.match(html, /Create a table/);
  assert.match(html, /No tables yet/);
  assert.match(html, /Play Tokens/);
  assert.match(html, />中文</);
  assert.doesNotMatch(html, /创建牌桌|暂时没有牌桌|游戏筹码/);
});

test("language: English mode switches table actions, status and results", () => {
  setStore({
    locale: "en",
    open: true,
    session: { playerId: "p3", token: "x", tableId: "t1", nickname: "Carol" },
    table: fixtureTable({
      winners: [{ playerId: "p2", nickname: "Bob", amount: 120, handLabel: "Full House, Ks over 8s" }],
      reveal: [{ playerId: "p2", nickname: "Bob", cards: ["13s", "8h"], handLabel: "Full House, Ks over 8s" }],
    }),
  });
  const html = render(React.createElement(__test.PokerOverlay));
  assert.match(html, /Hand #3/);
  assert.match(html, /Bob wins 120/);
  assert.match(html, /Showdown: /);
  assert.match(html, /Call 10/);
  assert.match(html, /Fold/);
  assert.match(html, /All-in/);
  assert.doesNotMatch(html, /第 3 手|赢得|摊牌：|跟注|弃牌|全下/);
});

test("language: server logs, errors, bot names and hand labels are localized in Chinese", () => {
  assert.equal(__test.translateLog("AI Player 2 raises to 50.", "zh"), "机器人 2 加注到 50。");
  assert.equal(__test.translateLog("Hand #8 finished.", "zh"), "第 8 手结束。");
  assert.equal(__test.translateLog("Showdown: Bob wins 120.", "zh"), "摊牌：Bob 赢得 120。");
  assert.equal(__test.translateError("not your turn", "zh"), "还没轮到你");
  assert.equal(__test.translateHandLabel("Full House, Ks over 8s", "zh"), "K 葫芦（带 8 对）");
  assert.equal(__test.translateLog("Bob raises to 50.", "en"), "Bob raises to 50.");
});

// ── geometry + CSS guards ────────────────────────────────────────────────────

test("seat geometry: 2 players — opponent top, viewer bottom (new explicit layout)", () => {
  const two = __test.seatPositions([0, 1], null, false);
  // desktop nominal stage 1100x620, seat 172x130, status band 30, margin 14
  assert.ok(Math.abs(two[0]!.left - 50) < 0.6, `first seat top-center x=${two[0]!.left}`);
  assert.ok(Math.abs(two[0]!.top - 21.2) < 0.6, `first seat near top y=${two[0]!.top}`);
  assert.ok(Math.abs(two[1]!.left - 50) < 0.6, `second seat bottom-center`);
  assert.ok(Math.abs(two[1]!.top - 87.3) < 0.6, `second seat at bottom y=${two[1]!.top}`);
  // the viewer's own seat is always the bottom (primary) slot
  const withViewer = __test.seatPositions([0, 1], 1, false);
  assert.ok(Math.abs(withViewer[1]!.top - 87.3) < 0.6, "viewer at the bottom");
});

test("seat geometry: every count stays inside the stage and the full card fits (containment)", () => {
  // Percent contract on the nominal stage.
  for (const count of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const seats = Array.from({ length: count }, (_, i) => i);
    const pos = __test.seatPositions(seats, count - 1, false);
    for (const p of pos) {
      assert.ok(p.left >= 2 && p.left <= 98 && p.top >= 8 && p.top <= 94, `count ${count} inside stage: ${JSON.stringify(p)}`);
    }
  }
});

test("seat geometry: px layout keeps every full card inside the stage at every size and count", () => {
  const layout = __test.seatPositionsPx as unknown as (
    seats: number[],
    viewer: number | null,
    compact: boolean,
    w: number,
    h: number,
  ) => { left: number; top: number }[];
  const boxes = __test.seatBoxes as unknown as (
    centers: { left: number; top: number }[],
    w: number,
    h: number,
  ) => { left: number; top: number; right: number; bottom: number }[];
  const stages = [
    { w: 1416, h: 720 }, // 1440x900 desktop
    { w: 1256, h: 540 }, // 1280x720
    { w: 1000, h: 628 }, // 1024x768
    { w: 800, h: 560 },
  ];
  const cardW = 172;
  const cardH = 130;
  for (const count of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const seats = Array.from({ length: count }, (_, i) => i);
    for (const stage of stages) {
      const centers = layout(seats, count - 1, false, stage.w, stage.h);
      const rects = boxes(centers, cardW, cardH);
      // every card fully inside the stage (16px bottom clearance for the dock)
      for (const r of rects) {
        assert.ok(r.left >= 12 && r.top >= 40 && r.right <= stage.w - 12 && r.bottom <= stage.h - 12,
          `count ${count} @ ${stage.w}x${stage.h} card inside stage: ${JSON.stringify(r)}`);
      }
      // no two cards overlap
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i]!;
          const b = rects[j]!;
          const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          assert.ok(!overlap, `count ${count} @ ${stage.w}x${stage.h}: seats ${i}/${j} overlap`);
        }
      }
    }
  }
});

test("seat geometry: compact 10-seat fallback stays inside the nominal 390px stage", () => {
  const ten = __test.seatPositions([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], null, true);
  for (const pos of ten) {
    assert.ok(pos.left >= 4 && pos.left <= 96 && pos.top >= 6 && pos.top <= 94, `compact seat inside stage: ${JSON.stringify(pos)}`);
  }
});

test("CSS: responsive breakpoints exist and mobile block never shrinks fonts below 11px", () => {
  const css = __test.CSS;
  assert.match(css, /@media \(max-width:1024px\)/);
  assert.match(css, /@media \(max-width:640px\)/);
  assert.match(css, /prefers-reduced-motion/);
  // the mobile block restructures layout (grid, aspect-ratio, seat ring) —
  // it must not contain any font-size below 11px.
  const mobileBlock = css.split("@media (max-width:640px)")[1]!.split("@media")[0]!;
  const sizes = [...mobileBlock.matchAll(/font-size:([0-9.]+)px/g)].map((m) => Number(m[1]));
  for (const size of sizes) assert.ok(size >= 11, `mobile font-size ${size}px < 11px violates the no-shrink rule`);
});

test("CSS: deal/bet/fold/win keyframes exist and are disabled under reduced motion", () => {
  const css = __test.CSS;
  for (const kf of ["hp-deal-in", "hp-bet-pop", "hp-fold-fade", "hp-win-glow", "hp-turn-pulse"]) {
    assert.match(css, new RegExp("@keyframes " + kf), `keyframes ${kf}`);
  }
  assert.match(css, /prefers-reduced-motion:reduce[\s\S]*?animation:\s*none\s*!important/);
});
