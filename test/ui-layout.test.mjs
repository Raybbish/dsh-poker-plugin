/**
 * Real-browser layout tests for the poker UI.
 *
 * Boots a real `dsh web` in an isolated DSH_HOME, opens the page in Chrome,
 * plays real players over WebSocket, then asserts actual layout via
 * getBoundingClientRect / getComputedStyle at four viewports and for player
 * counts 2/3/4/6. Writes screenshots to test-artifacts/ui/.
 *
 * Run: npm run test:ui   (requires Google Chrome; playwright-core only)
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { WebSocket } from "ws";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { bootTestServer } from "./helpers/boot-server.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACTS = join(ROOT, "test-artifacts", "ui");
mkdirSync(ARTIFACTS, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440", w: 1440, h: 900 },
  { name: "desktop-1280", w: 1280, h: 720 },
  { name: "tablet-1024", w: 1024, h: 768 },
  { name: "mobile-390", w: 390, h: 844 },
];

let server;
let browser;

before(async () => {
  server = await bootTestServer();
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

after(async () => {
  await browser?.close().catch(() => {});
  server?.cleanup();
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(predicate, what, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await sleep(100);
  }
  throw new Error(`timeout waiting for ${what}`);
}

// ── WS bots (real players, like a second browser window) ────────────────────
let botSeq = 0;
class Bot {
  constructor(nickname) {
    this.nickname = nickname;
    this.ws = new WebSocket(`ws://127.0.0.1:${server.port}/poker/ws`);
    this.lobby = null;
    this.joined = false;
    this.playerId = null;
    this.table = null;
    this.errors = [];
    this.ready = new Promise((resolve, reject) => {
      this.ws.on("open", resolve);
      this.ws.on("error", reject);
    });
    this.ws.on("message", (d) => {
      const m = JSON.parse(d.toString());
      if (m.type === "lobby") this.lobby = m.tables;
      if (m.type === "joined") {
        this.joined = true;
        this.playerId = m.playerId;
      }
      if (m.type === "snapshot") this.table = m.table;
      if (m.type === "error") this.errors.push(m);
    });
  }
  send(msg) {
    this.ws.send(JSON.stringify(msg));
  }
  async join(tableId) {
    await this.ready;
    this.send({ type: "joinTable", requestId: `b${++botSeq}`, tableId, nickname: this.nickname, buyIn: 1000 });
  }
  close() {
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
  }
}

async function playBotAction(bot, action, amount) {
  await waitFor(
    () => bot.table !== null && bot.table.myLegalActions.some((candidate) => candidate.type === action),
    `${bot.nickname} can ${action}`,
    8_000,
  );
  bot.send({
    type: "action",
    commandId: `a${++botSeq}`,
    playerId: bot.playerId,
    tableId: bot.table.tableId,
    expectedVersion: bot.table.version,
    action,
    ...(amount === undefined ? {} : { amount }),
  });
}

async function createTableWithBots(name, botCount) {
  // Nicknames are capped at 20 characters by the wire protocol. Keep fixture
  // names deliberately short even when the table name includes a timestamp.
  const manager = new Bot(`Bot-${++botSeq}`);
  await manager.ready;
  manager.send({ type: "createTable", requestId: `c${++botSeq}`, name, maxSeats: Math.max(6, botCount + 1) });
  await waitFor(() => manager.lobby !== null && manager.lobby.some((t) => t.name === name), "table in bot lobby");
  const tableId = manager.lobby.find((t) => t.name === name).tableId;
  await manager.join(tableId);
  const bots = [manager];
  for (let i = 1; i < botCount; i++) {
    const b = new Bot(`Bot-${++botSeq}`);
    await b.join(tableId);
    bots.push(b);
  }
  await waitFor(() => bots.every((b) => b.joined || b.errors.length > 0), "all bot join responses");
  if (bots.some((b) => b.errors.length > 0)) {
    throw new Error(`bot join errors: ${JSON.stringify(bots.map((b) => ({ nickname: b.nickname, joined: b.joined, errors: b.errors })))}`);
  }
  return { tableId, bots };
}

async function dismissOverlays(page) {
  // The shipped web app mounts its modals (beta disclaimer, API-key setup)
  // asynchronously after boot; wait for them to appear, then dismiss anything
  // sitting on top of the Poker button until a real hit-test finds it.
  await page.waitForTimeout(2200);
  for (let i = 0; i < 14; i++) {
    const result = await page.evaluate(() => {
      const b = document.querySelector(".hp-sidebar-btn");
      const r = b.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const isButton = top !== null && (top === b || b.contains(top));
      if (isButton) return "clear";
      const modalBtn = [...document.querySelectorAll("button")].find((x) => {
        if (x.closest(".hp-sidebar-btn") !== null) return false;
        const t = (x.textContent || "").trim();
        return /^(继续|Continue|稍后配置|Configure later|跳过|Skip|Later|确定|知道了|Got it|OK|关闭|Dismiss|稍后)$/i.test(t);
      });
      if (modalBtn) { modalBtn.click(); return "clicked:" + modalBtn.textContent.trim(); }
      const mask = document.querySelector("[class*=mask]");
      if (mask) {
        const cand = mask.parentElement?.querySelector("button") || mask.parentElement?.parentElement?.querySelector("button");
        if (cand) { cand.click(); return "maskbtn"; }
      }
      return "unknown";
    });
    if (result === "clear") return;
    await page.waitForTimeout(800);
  }
  throw new Error("could not dismiss overlays over the Poker button");
}

async function openPoker(page) {
  await page.goto(server.url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".hp-sidebar-btn", { timeout: 45_000 });
  await dismissOverlays(page);
  const box = await page.locator(".hp-sidebar-btn").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  try {
    await page.waitForSelector(".hp-root", { timeout: 15_000 });
  } catch (err) {
    const dbg = await page.evaluate(() => ({
      masks: document.querySelectorAll("[class*=mask]").length,
      btnClass: document.querySelector(".hp-sidebar-btn")?.className,
      modalText: document.querySelector("[class*=mask]")?.parentElement?.textContent.slice(0, 60) ?? null,
    }));
    console.error("OPEN FAIL diagnostics:", JSON.stringify(dbg));
    throw err;
  }
  await page.waitForSelector(".hp-lobby", { timeout: 15_000 });
}

async function joinViaUi(page, tableId, nickname) {
  await page.fill('[data-testid="nickname"]', nickname);
  await page.click(`[data-testid="join-${tableId}"]`);
  await page.waitForSelector(".hp-stage", { timeout: 15_000 });
  try {
    await waitFor(async () => (await page.locator(".hp-seat").count()) >= 2, "table renders seats", 8_000);
  } catch (err) {
    const diagnostics = await page.evaluate(() => ({
      seatNodes: document.querySelectorAll(".hp-seat").length,
      errorText: document.querySelector(".hp-err")?.textContent ?? null,
      store: (window).__hpStore ?? null,
    }));
    throw new Error(`${err.message}: ${JSON.stringify(diagnostics)}`);
  }
}

/** In-page measurement: real rects + computed styles. */
const MEASURE = `() => {
  const rect = (el) => {
    const b = el.getBoundingClientRect();
    return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height };
  };
  const parseColor = (s) => {
    const m = s.match(/[\\d.]+/g);
    if (!m) return null;
    return m.slice(0, 3).map(Number);
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  // effective background under an element: blend translucent surfaces upward
  const effectiveBg = (el) => {
    let r = 0, g = 0, b = 0, alpha = 0;
    let node = el;
    while (node && alpha < 1) {
      const s = getComputedStyle(node);
      const c = parseColor(s.backgroundColor);
      if (c && c.length >= 3) {
        const rawAlpha = s.backgroundColor.startsWith("rgba") ? parseFloat((s.backgroundColor.match(/[\\d.]+/g) || [])[3] ?? "1") : 1;
        const a = Number.isFinite(rawAlpha) ? rawAlpha : 1;
        if (a > 0) {
          r = c[0] * a + r * (1 - a);
          g = c[1] * a + g * (1 - a);
          b = c[2] * a + b * (1 - a);
          alpha = alpha + a * (1 - alpha);
        }
      }
      node = node.parentElement;
    }
    return [r, g, b];
  };
  const ratio = (fg, bg) => (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
  const contrastOf = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return ratio(parseColor(getComputedStyle(el).color), effectiveBg(el));
  };
  const out = {};
  const root = document.querySelector(".hp-root");
  const rootColor = parseColor(getComputedStyle(root).backgroundColor);
  out.rootColor = rootColor;
  out.rootIsReferenceLight = rootColor !== null && rootColor[0] >= 240 && rootColor[1] >= 240 && rootColor[2] >= 235;
  out.contrastSeatName = contrastOf(".hp-seat .hp-sname");
  out.contrastSeatStack = contrastOf(".hp-seat .hp-sstack");
  out.contrastDock = contrastOf(".hp-action-btn");

  const stage = document.querySelector(".hp-stage");
  const stageRect = stage ? rect(stage) : null;
  const seats = [...document.querySelectorAll(".hp-seat")].map(rect);
  out.stageRect = stageRect;
  out.seatRects = seats;
  out.seatCount = seats.length;
  out.seatsInStage = stageRect !== null && seats.every((s) => s.left >= stageRect.left - 1 && s.top >= stageRect.top - 1 && s.right <= stageRect.right + 1 && s.bottom <= stageRect.bottom + 1);
  out.seatsOverlap = seats.some((a, i) => seats.some((bb, j) => i < j && a.left < bb.right - 1 && bb.left < a.right - 1 && a.top < bb.bottom - 1 && bb.top < a.bottom - 1));

  const overlaps = (a, b, tol = 1) =>
    a.left < b.right - tol && b.left < a.right - tol && a.top < b.bottom - tol && b.top < a.bottom - tol;
  out.seatInternalOverlaps = [...document.querySelectorAll(".hp-seat")].flatMap((seat, seatIndex) => {
    const cards = seat.querySelector(".hp-cards");
    if (!cards) return [];
    const cardRect = rect(cards);
    return [".hp-avatar", ".hp-sname", ".hp-sstack", ".hp-sbet"].flatMap((selector) => {
      const target = seat.querySelector(selector);
      return target && overlaps(cardRect, rect(target)) ? [{ seatIndex, selector, cards: cardRect, target: rect(target) }] : [];
    });
  });

  const dock = document.querySelector(".hp-dock");
  const dockRect = dock ? rect(dock) : null;
  out.dockVisible = dockRect !== null && dockRect.top >= 0 && dockRect.bottom <= innerHeight + 1 && dockRect.height > 10;
  out.seatsVsDock = dockRect !== null && seats.every((s) => s.bottom <= dockRect.top - 1);
  out.dockGap = dockRect !== null && seats.length > 0 ? Math.min(...seats.map((s) => dockRect.top - s.bottom)) : null;

  const community = document.querySelector(".hp-community");
  const pot = document.querySelector(".hp-pot");
  const felt = document.querySelector(".hp-felt");
  const disjoint = (a, b, tol) => a.right < b.left - tol || b.right < a.left - tol || a.bottom < b.top - tol || b.bottom < a.top - tol;
  const cRect = community ? rect(community) : null;
  const pRect = pot ? rect(pot) : null;
  const fRect = felt ? rect(felt) : null;
  out.seatsVsCommunity = cRect === null || seats.every((s) => disjoint(s, cRect, 4));
  out.seatsVsPot = pRect === null || seats.every((s) => disjoint(s, pRect, 4));
  out.seatsVsFelt = fRect === null || seats.every((s) => disjoint(s, fRect, 4));

  out.noHScroll = document.documentElement.scrollWidth <= innerWidth + 1;
  const buttons = [...document.querySelectorAll(".hp-action-btn")].map((b) => rect(b).height);
  out.minBtnHeight = buttons.length ? Math.min(...buttons) : null;
  return out;
}`;

async function assertLayout(page, viewport, playerCount) {
  const m = await page.evaluate(`(${MEASURE})()`);
  const failures = [];
  const check = (name, ok, detail = "") => {
    if (!ok) failures.push(`${name}${detail ? " — " + detail : ""}`);
  };
  check("root uses the light game-center surface", m.rootIsReferenceLight, `rgb(${m.rootColor})`);
  check("seat name contrast ≥ 4.5", m.contrastSeatName !== null && m.contrastSeatName >= 4.5, `contrast=${m.contrastSeatName?.toFixed(2)}`);
  check("seat stack contrast ≥ 4.5", m.contrastSeatStack !== null && m.contrastSeatStack >= 4.5, `contrast=${m.contrastSeatStack?.toFixed(2)}`);
  check("dock button contrast ≥ 4.5", m.contrastDock !== null && m.contrastDock >= 4.5, `contrast=${m.contrastDock?.toFixed(2)}`);
  check(`all ${m.seatCount} player cards inside the stage`, m.seatsInStage, JSON.stringify(m));
  check("no two player cards overlap", !m.seatsOverlap);
  check("hole cards do not cover player identity or betting info", m.seatInternalOverlaps.length === 0, JSON.stringify(m.seatInternalOverlaps));
  check("player cards do not overlap the action dock", m.seatsVsDock, `gap=${m.dockGap?.toFixed(1)}`);
  check("player cards do not overlap the community cards", m.seatsVsCommunity);
  check("player cards do not overlap the pot", m.seatsVsPot);
  // Seat cards deliberately straddle the felt rim, like a real poker-table
  // rail. We guard the meaningful collisions above: other seats, community
  // cards, the pot and the action dock.
  check("action dock fully visible", m.dockVisible);
  check("no unexpected horizontal scroll", m.noHScroll);
  if (viewport.w <= 640) check("mobile action buttons ≥ 44px touch targets", m.minBtnHeight !== null && m.minBtnHeight >= 44, `min=${m.minBtnHeight}`);
  assert.deepEqual(failures, [], `${viewport.name} (${playerCount} players) layout failures`);
  return m;
}

test("language switch changes the whole lobby and persists after reload", { timeout: 120000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await openPoker(page);
    await page.getByRole("heading", { name: "创建牌桌" }).waitFor();
    await page.getByTestId("language-toggle").click();
    await page.getByRole("heading", { name: "Create a table" }).waitFor();
    assert.equal(await page.getByText("暂时没有牌桌").count(), 0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hp-sidebar-btn", { timeout: 45_000 });
    await dismissOverlays(page);
    const box = await page.locator(".hp-sidebar-btn").boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.getByRole("heading", { name: "Create a table" }).waitFor();
    assert.equal(((await page.getByTestId("language-toggle").textContent()) ?? "").trim(), "中文");
  } finally {
    await context.close();
  }
});

test("primary bet button submits the displayed amount", { timeout: 120000 }, async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const sentFrames = [];
  page.on("websocket", (socket) => {
    socket.on("framesent", (event) => sentFrames.push(String(event.payload)));
  });
  let bots = [];
  try {
    await openPoker(page);
    const created = await createTableWithBots(`UI-bet-${Date.now()}`, 1);
    bots = created.bots;
    await joinViaUi(page, created.tableId, "You");

    // Heads-up: the first player is the small blind and acts first. A raise to
    // 20 followed by the browser's call creates the exact 40-chip pot from the
    // reported screenshot; the flop primary action then reads "下注 50".
    await playBotAction(bots[0], "raise", 20);
    const callButton = page.locator(".hp-action-btn.call:not([disabled])");
    await callButton.waitFor({ state: "visible" });
    assert.match((await callButton.textContent()) ?? "", /跟注 10/);
    await callButton.click();

    const betButton = page.getByRole("button", { name: "下注 50", exact: true });
    await betButton.waitFor({ state: "visible" });
    assert.equal(((await betButton.textContent()) ?? "").trim(), "下注 50");
    sentFrames.length = 0;
    await betButton.click();

    await waitFor(
      () => sentFrames.some((payload) => {
        try {
          const message = JSON.parse(payload);
          return message.type === "action" && message.action === "bet" && message.amount === 50;
        } catch {
          return false;
        }
      }),
      "clicking 下注 50 sends bet 50",
      2_000,
    );
  } finally {
    bots.forEach((bot) => bot.close());
    await context.close();
  }
});

test("browser layout: four viewports with 4 players + screenshots", { timeout: 240000 }, async () => {
  const context = await browser.newContext({ viewport: { width: VIEWPORTS[0].w, height: VIEWPORTS[0].h } });
  const page = await context.newPage();
  try {
    console.log("STEP openPoker");
    await openPoker(page);
    console.log("STEP createTableWithBots");
    const { tableId, bots } = await createTableWithBots(`UI-4p-${Date.now()}`, 3); // 3 bots + browser = 4
    console.log("STEP joinViaUi");
    await joinViaUi(page, tableId, "You");
    await waitFor(async () => (await page.locator(".hp-seat").count()) === 4, "4 seats render");
    await sleep(400); // let ResizeObserver settle positions

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await sleep(500);
      const shot = join(ARTIFACTS, `${vp.name}.png`);
      await page.screenshot({ path: shot });
      const m = await assertLayout(page, vp, 4);
      console.log(`${vp.name}: ${m.seatCount} seats, gap=${m.dockGap?.toFixed(1)}px → ${shot}`);
    }
    bots.forEach((b) => b.close());
  } finally {
    await context.close();
  }
});

test("browser layout: player counts 2/3/6/10 at 1440x900", { timeout: 300000 }, async () => {
  for (const count of [2, 3, 6, 10]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    let bots = [];
    try {
      await openPoker(page);
      const created = await createTableWithBots(`UI-${count}p-${Date.now()}`, count - 1);
      bots = created.bots;
      await joinViaUi(page, created.tableId, "You");
      await waitFor(async () => (await page.locator(".hp-seat").count()) === count, `${count} seats render`);
      await sleep(400);
      const m = await assertLayout(page, { name: `ui-${count}p`, w: 1440, h: 900 }, count);
      const shot = join(ARTIFACTS, `players-${count}.png`);
      await page.screenshot({ path: shot });
      console.log(`players-${count}: ${m.seatCount} seats → ${shot}`);
    } finally {
      bots.forEach((b) => b.close());
      await context.close();
    }
  }
});

test("screenshots were written for all four viewports", () => {
  for (const vp of VIEWPORTS) {
    assert.ok(existsSync(join(ARTIFACTS, `${vp.name}.png`)), `screenshot ${vp.name}.png exists`);
  }
});
