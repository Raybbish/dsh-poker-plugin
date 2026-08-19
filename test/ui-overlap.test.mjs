import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(ROOT, "src", "client", "poker.css"), "utf8");

function overlaps(a, b, gap = 0) {
  return a.left < b.right + gap && b.left < a.right + gap && a.top < b.bottom + gap && b.top < a.bottom + gap;
}

test("short desktop: viewer hole cards keep clear of the pot", async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 600 } });
  try {
    // Mirrors a short 1280×600 window and the bottom-seat centre produced by
    // seatPositionsPx. The action label deliberately reproduces the report.
    await page.setContent(`
      <style>${CSS}</style>
      <div class="hp-root">
        <div class="hp-stage" style="position:relative;width:1280px;height:454px;display:block;flex:none">
          <div class="hp-felt"><div class="hp-pot">底池 15（10 + 5）</div></div>
          <div class="hp-seat me turn" style="left:640px;top:375px">
            <div class="hp-seat-head"><div class="hp-avatar">A</div><div class="hp-sname">aa（你）</div></div>
            <div class="hp-srow"><div class="hp-sstack">995</div></div>
            <div class="hp-last-action" data-action="bet">下注 5</div>
            <div class="hp-cards"><div class="hp-card small red">A♦</div><div class="hp-card small">5♣</div></div>
          </div>
        </div>
      </div>
    `);
    const geometry = await page.evaluate(() => {
      const rect = (selector) => {
        const value = document.querySelector(selector).getBoundingClientRect();
        return { left: value.left, top: value.top, right: value.right, bottom: value.bottom };
      };
      return { seat: rect(".hp-seat.me"), cards: rect(".hp-seat.me .hp-cards"), pot: rect(".hp-pot") };
    });
    assert.equal(overlaps(geometry.cards, geometry.pot, 6), false, JSON.stringify(geometry));
    assert.equal(overlaps(geometry.seat, geometry.pot, 6), false, JSON.stringify(geometry));
  } finally {
    await browser.close();
  }
});
