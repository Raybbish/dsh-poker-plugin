/** One player card: avatar, name, stack, bet, state, hole cards, badges. */
import * as React from "react";
import type { SeatView as SeatViewType } from "../view-types";
import { fmt } from "../store";
import { Badges, CardView } from "./ui";

export interface PlayerSeatProps {
  seat: SeatViewType;
  handNumber: number;
  secondsLeft: number | null;
  deadlineMs: number;
  isWinner: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function PlayerSeat(props: PlayerSeatProps): React.ReactElement | null {
  const { seat } = props;
  if (seat === undefined || seat.playerId === "") return null;

  let cards: React.ReactNode = null;
  if (seat.holeCards !== undefined && seat.holeCards.length > 0) {
    cards = React.createElement(
      "div",
      { className: "hp-cards" },
      seat.holeCards.map((c, i) => React.createElement(CardView, { key: `h${props.handNumber}-${i}`, card: c, small: true, delay: 90 + i * 90 })),
    );
  } else if (!seat.folded && !seat.excluded) {
    cards = React.createElement(
      "div",
      { className: "hp-cards" },
      React.createElement(CardView, { key: `b${props.handNumber}-0`, card: null, small: true }),
      React.createElement(CardView, { key: `b${props.handNumber}-1`, card: null, small: true }),
    );
  }

  let stateText: React.ReactNode = null;
  if (seat.folded) stateText = React.createElement("div", { className: "hp-sstate" }, "已弃牌");
  else if (seat.excluded) stateText = React.createElement("div", { className: "hp-sstate" }, "等待下一手");
  else if (seat.allIn) stateText = React.createElement("div", { className: "hp-sstate allin" }, "全下");

  const countdown =
    seat.isTurn && props.deadlineMs > 0 && props.secondsLeft !== null
      ? React.createElement("div", { className: "hp-count" }, `${props.secondsLeft}s`)
      : null;

  let cls = "hp-seat";
  if (seat.isMe) cls += " me";
  if (seat.isTurn) cls += " turn";
  if (seat.folded) cls += " folded";
  if (props.isWinner) cls += " winner";
  if (props.className) cls += " " + props.className;

  return React.createElement(
    "div",
    { className: cls, style: props.style },
    React.createElement(
      "div",
      { className: "hp-seat-head" },
      React.createElement(
        "div",
        { className: "hp-avatar" },
        (seat.nickname || "?").slice(0, 1).toUpperCase(),
        React.createElement(Badges, { isDealer: seat.isDealer, isSmallBlind: seat.isSmallBlind, isBigBlind: seat.isBigBlind }),
        React.createElement("div", { className: "hp-dot" + (seat.connected ? "" : " off") }),
      ),
      React.createElement("div", { className: "hp-sname" }, seat.nickname + (seat.isMe ? "（你）" : "")),
      seat.isBot ? React.createElement("span", { className: "hp-ai-badge" }, "AI") : null,
      countdown,
    ),
    React.createElement(
      "div",
      { className: "hp-srow" },
      React.createElement("div", { className: "hp-sstack" }, fmt(seat.stack)),
      seat.bet > 0 ? React.createElement("div", { key: `bet-${seat.playerId.slice(0, 6)}-${seat.bet}`, className: "hp-sbet" }, `下注 ${fmt(seat.bet)}`) : null,
    ),
    stateText,
    cards,
  );
}

export type { SeatViewType };
