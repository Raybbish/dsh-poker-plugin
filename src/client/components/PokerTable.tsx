/** Community board, pot, waiting state — the inside of the felt. */
import * as React from "react";
import type { Card, Pot } from "../view-types";
import { fmt } from "../store";
import { CardView } from "./ui";

export function CommunityCards(props: { community: Card[]; handNumber: number }): React.ReactElement {
  if (props.community.length === 0) return React.createElement(React.Fragment, null);
  return React.createElement(
    "div",
    { className: "hp-community" },
    props.community.map((c, i) => React.createElement(CardView, { key: `c${props.handNumber}-${i}`, card: c, delay: i * 70 })),
  );
}

export function PotDisplay(props: { pots: Pot[] }): React.ReactElement | null {
  const total = props.pots.reduce((s, p) => s + p.amount, 0);
  if (total === 0 && props.pots.length === 0) return null;
  let label = total > 0 ? `底池 ${fmt(total)}` : "底池 0";
  if (props.pots.length > 1) label += `  (${props.pots.map((p) => fmt(p.amount)).join(" + ")})`;
  return React.createElement("div", { key: `pot-${total}`, className: "hp-pot" }, label);
}

export function WaitingState(props: { seated: number; maxSeats: number }): React.ReactElement {
  return React.createElement(
    "div",
    { className: "hp-waiting" },
    React.createElement("div", { className: "hp-bigspade" }, "♠"),
    React.createElement("div", { className: "hp-wtitle" }, "等待玩家入座"),
    React.createElement("div", { className: "hp-hint" }, `${props.seated}/${props.maxSeats} 人 · 复制房间 ID 邀请朋友`),
  );
}
