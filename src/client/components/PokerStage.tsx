/** The poker stage: status line, felt (community/pot), player seats.
 *
 * Desktop: seats are absolutely positioned by the px layout engine so every
 * full card stays inside the stage (containment by construction).
 * Mobile (≤640px): the stage switches to a flow layout — opponent rows, felt,
 * viewer — so seats can never overlap or escape the stage.
 */
import * as React from "react";
import type { TableView } from "../view-types";
import { NOMINAL_STAGE, SEAT_H, SEAT_W, seatPositionsPx } from "../layout";
import { PlayerSeat } from "./PlayerSeat";
import { CommunityCards, PotDisplay, WaitingState } from "./PokerTable";
import { useCompact } from "./useCompact";
import { useStore } from "../store";
import { tx } from "../i18n";

function useElementSize<T extends HTMLElement>(): [React.RefObject<T>, { width: number; height: number }] {
  const ref = React.useRef<T | null>(null);
  const [size, setSize] = React.useState({ width: NOMINAL_STAGE.w, height: NOMINAL_STAGE.h });
  React.useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r !== undefined && r.width > 0 && r.height > 0) setSize({ width: r.width, height: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

export interface PokerStageProps {
  table: TableView;
}

export function PokerStage(props: PokerStageProps): React.ReactElement {
  const t = props.table;
  const locale = useStore().locale;
  const compact = useCompact();
  const [stageRef, size] = useElementSize<HTMLDivElement>();

  const occupied = t.seats.filter((s) => s.playerId !== "");
  const viewerSeat = t.mySeat;
  const secondsLeft = t.actionDeadlineAt > 0 ? Math.max(0, Math.ceil((t.actionDeadlineAt - Date.now()) / 1000)) : null;
  const winnerIds = new Set(t.winners.map((w) => w.playerId));

  const positions = seatPositionsPx(occupied.map((s) => s.seat), viewerSeat, false, size.width, size.height);
  const bySeat = new Map<number, { left: number; top: number }>();
  occupied.forEach((s, i) => {
    const p = positions[i];
    if (p !== undefined) bySeat.set(s.seat, p);
  });

  const renderSeat = (s: (typeof occupied)[number]) => {
    const pos = bySeat.get(s.seat);
    return React.createElement(PlayerSeat, {
      key: s.playerId,
      seat: s,
      handNumber: t.handNumber,
      secondsLeft,
      deadlineMs: t.actionDeadlineAt,
      isWinner: winnerIds.has(s.playerId),
      style: pos !== undefined && !compact ? { left: pos.left, top: pos.top } : undefined,
      className: compact ? (s.isMe ? undefined : "flow") : undefined,
    });
  };

  const felt = React.createElement(
    "div",
    { className: "hp-felt" },
    t.phase === "idle"
      ? React.createElement(WaitingState, { seated: occupied.length, maxSeats: t.maxSeats })
      : React.createElement(CommunityCards, { community: t.community, handNumber: t.handNumber }),
    React.createElement(PotDisplay, { pots: t.pots }),
  );

  const opponents = occupied.filter((s) => !s.isMe);

  let body: React.ReactNode;
  if (compact) {
    // flow layout: status line → opponent rows → felt → viewer
    body = React.createElement(
      React.Fragment,
      null,
      React.createElement("div", { className: "hp-seats-row" }, opponents.map(renderSeat)),
      felt,
      occupied.filter((s) => s.isMe).map(renderSeat),
    );
  } else {
    body = React.createElement(
      React.Fragment,
      null,
      felt,
      occupied.map(renderSeat),
    );
  }

  const phaseLabel =
    ({
      idle: tx(locale, "phaseIdle"),
      preflop: tx(locale, "phasePreflop"),
      flop: tx(locale, "phaseFlop"),
      turn: tx(locale, "phaseTurn"),
      river: tx(locale, "phaseRiver"),
      showdown: tx(locale, "phaseShowdown"),
    } as Record<string, string>)[t.phase] ?? t.phase;
  return React.createElement(
    "div",
    { className: "hp-stage", ref: stageRef as React.Ref<HTMLDivElement> },
    React.createElement(
      "div",
      { className: "hp-statusline" },
      React.createElement("span", { className: "hp-phase" }, phaseLabel),
      React.createElement("span", { className: "hp-hand" }, tx(locale, "hand", { n: t.handNumber })),
      React.createElement("span", null, `${t.name}`),
    ),
    body,
  );
}
