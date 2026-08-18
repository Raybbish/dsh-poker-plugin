/**
 * Seat layout engine.
 *
 * Desktop: explicit per-player-count templates mapped onto the stage's SAFE
 * AREA (the stage minus margins, the status band and the reserved bottom), so
 * every full player card is contained by construction — positions are computed
 * from the measured stage in px, never from "percent of the ellipse".
 *
 * Compact: templates tuned for narrow screens (the real mobile layout is a
 * flow layout in CSS; this remains the tested geometric fallback).
 *
 * The viewer's own seat always takes the bottom "primary" slot; opponents fill
 * the remaining slots in seat order. Spectators (no viewer) use the same
 * templates with the last slot holding a real player.
 */

export const SEAT_W = 172;
// Includes the header, stack row, two mini cards, gaps, padding and border.
// Keep this at or above the rendered card's real border-box height so the
// geometry engine never places a visual edge outside the stage.
export const SEAT_H = 130;
export const SEAT_W_COMPACT = 150;
export const SEAT_H_COMPACT = 118;
export const STAGE_MARGIN = 14;
export const STATUS_BAND = 30;
export const NOMINAL_STAGE = { w: 1100, h: 620 };
export const NOMINAL_STAGE_COMPACT = { w: 390, h: 700 };

/** [rx, ry] ratios inside the safe area; the last slot is the viewer's. */
type Slot = [number, number];

const DESKTOP: Record<number, Slot[]> = {
  2: [
    [0.5, 0.06],
    [0.5, 1],
  ],
  3: [
    [0.25, 0.06],
    [0.75, 0.06],
    [0.5, 1],
  ],
  4: [
    [0.5, 0.06],
    [0.1, 0.52],
    [0.9, 0.52],
    [0.5, 1],
  ],
  5: [
    [0.25, 0.06],
    [0.75, 0.06],
    [0.08, 0.52],
    [0.92, 0.52],
    [0.5, 1],
  ],
  6: [
    [0.16, 0.05],
    [0.5, 0.03],
    [0.84, 0.05],
    [0.08, 0.52],
    [0.92, 0.52],
    [0.5, 1],
  ],
};

const COMPACT: Record<number, Slot[]> = {
  2: [
    [0.5, 0.06],
    [0.5, 1],
  ],
  3: [
    [0.3, 0.06],
    [0.7, 0.06],
    [0.5, 1],
  ],
  4: [
    [0.25, 0.06],
    [0.75, 0.06],
    [0.5, 0.3],
    [0.5, 1],
  ],
  5: [
    [0.25, 0.06],
    [0.75, 0.06],
    [0.25, 0.32],
    [0.75, 0.32],
    [0.5, 1],
  ],
  6: [
    [0.2, 0.05],
    [0.5, 0.07],
    [0.8, 0.05],
    [0.25, 0.32],
    [0.75, 0.32],
    [0.5, 1],
  ],
};

/** 6-player variant for narrow stages where four top seats would collide. */
const DESKTOP_6_NARROW: Slot[] = [
  [0.16, 0.05],
  [0.5, 0.03],
  [0.84, 0.05],
  [0.08, 0.5],
  [0.92, 0.5],
  [0.5, 1],
];

function templateFor(count: number, compact: boolean, safeW: number): Slot[] {
  const n = Math.min(Math.max(count, 2), 6);
  if (!compact && n === 6 && safeW < 4 * SEAT_W + 3 * 16) {
    return DESKTOP_6_NARROW;
  }
  const table = compact ? COMPACT : DESKTOP;
  return table[n] ?? table[6]!;
}

/** slot index (into the template) for each input seat. */
function slotIndexOf(seats: number[], viewerSeat: number | null): number[] {
  const viewerIdx = seats.indexOf(viewerSeat ?? -1);
  const order: number[] = [];
  for (let i = 0; i < seats.length; i++) if (i !== viewerIdx) order.push(i);
  if (viewerIdx >= 0) order.push(viewerIdx); // viewer takes the last (bottom) slot
  const out = new Array<number>(seats.length);
  order.forEach((seatIdx, slotIdx) => {
    out[seatIdx] = slotIdx;
  });
  return out;
}

function compute(
  seats: number[],
  viewerSeat: number | null,
  compact: boolean,
  stageW: number,
  stageH: number,
): { left: number; top: number }[] {
  const cardW = compact ? SEAT_W_COMPACT : SEAT_W;
  const cardH = compact ? SEAT_H_COMPACT : SEAT_H;
  const m = STAGE_MARGIN;
  const status = compact ? 0 : STATUS_BAND;
  const safeW = Math.max(stageW - cardW - 2 * m, 1);
  const safeH = Math.max(stageH - status - cardH - 2 * m, 1);
  const template = templateFor(seats.length, compact, safeW);
  const slotIdx = slotIndexOf(seats, viewerSeat);
  return seats.map((_, i) => {
    const [rx, ry] = template[slotIdx[i]!] ?? template[0]!;
    return {
      left: m + cardW / 2 + rx * safeW,
      top: status + m + cardH / 2 + ry * safeH,
    };
  });
}

/** Percent positions on a nominal stage (unit-test contract). */
export function seatPositions(
  seats: number[],
  viewerSeat: number | null,
  compact: boolean,
): { left: number; top: number }[] {
  const stage = compact ? NOMINAL_STAGE_COMPACT : NOMINAL_STAGE;
  const out = compute(seats, viewerSeat, compact, stage.w, stage.h);
  return out.map((p) => ({ left: (p.left / stage.w) * 100, top: (p.top / stage.h) * 100 }));
}

/** Exact px positions from a measured stage (used by the real layout). */
export function seatPositionsPx(
  seats: number[],
  viewerSeat: number | null,
  compact: boolean,
  stageW: number,
  stageH: number,
): { left: number; top: number }[] {
  return compute(seats, viewerSeat, compact, stageW, stageH);
}

/** Full card boxes for a set of centers (used by tests to verify containment). */
export function seatBoxes(
  centers: { left: number; top: number }[],
  cardW: number,
  cardH: number,
): { left: number; top: number; right: number; bottom: number }[] {
  return centers.map((c) => ({
    left: c.left - cardW / 2,
    top: c.top - cardH / 2,
    right: c.left + cardW / 2,
    bottom: c.top + cardH / 2,
  }));
}
