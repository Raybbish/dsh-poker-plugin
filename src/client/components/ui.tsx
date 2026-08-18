/** Shared presentational bits. */
import * as React from "react";
import type { Card } from "../view-types";
import { cardId, cardLabel, suitChar, suitRed } from "../store";

export function CardView(props: { card: Card | null; small?: boolean; mini?: boolean; delay?: number; cardKey?: string }): React.ReactElement {
  const { card } = props;
  let cls = "hp-card";
  if (props.mini) cls += " mini";
  else if (props.small) cls += " small";
  const style = props.delay !== undefined ? { animationDelay: `${props.delay}ms` } : undefined;
  if (card === null || card === undefined) return React.createElement("div", { className: cls + " back" });
  cls += suitRed(card.suit) ? " red" : "";
  return React.createElement(
    "div",
    { className: cls, style },
    React.createElement("span", { className: "r" }, cardLabel(card.rank)),
    React.createElement("span", { className: "s" }, suitChar(card.suit)),
  );
}

export function Badges(props: { isDealer: boolean; isSmallBlind: boolean; isBigBlind: boolean }): React.ReactElement {
  const els: React.ReactNode[] = [];
  if (props.isDealer) els.push(React.createElement("div", { key: "d", className: "hp-dbtn" }, "D"));
  if (props.isSmallBlind) els.push(React.createElement("div", { key: "sb", className: "hp-blind" }, "SB"));
  if (props.isBigBlind) els.push(React.createElement("div", { key: "bb", className: "hp-blind" }, "BB"));
  return React.createElement(React.Fragment, null, els);
}

export function Spinner(props: { label: string }): React.ReactElement {
  return React.createElement(
    "div",
    { className: "hp-loading" },
    React.createElement("div", { className: "hp-spinner" }),
    React.createElement("div", null, props.label),
  );
}

export { cardId, cardLabel, suitChar, suitRed };
