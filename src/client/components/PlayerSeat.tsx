/** One player card: avatar, name, stack, bet, state, hole cards, badges. */
import * as React from "react";
import type { SeatView as SeatViewType } from "../view-types";
import { fmt, useStore } from "../store";
import { Badges, CardView } from "./ui";
import { displayNickname, tx } from "../i18n";
import { characterForSeat, characterStateForSeat, characterThought } from "../characters";

export interface PlayerSeatProps {
  seat: SeatViewType;
  handNumber: number;
  secondsLeft: number | null;
  deadlineMs: number;
  isWinner: boolean;
  winAmount: number;
  phase: string;
  style?: React.CSSProperties;
  className?: string;
}

export function PlayerSeat(props: PlayerSeatProps): React.ReactElement | null {
  const { seat } = props;
  const locale = useStore().locale;
  if (seat === undefined || seat.playerId === "") return null;
  const character = seat.isBot ? characterForSeat(seat.seat, locale) : null;
  const characterState = character === null ? null : characterStateForSeat(seat, props.phase, props.isWinner);
  const thought = characterState === null ? "" : characterThought(seat.seat, characterState, locale);

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
  if (seat.folded) stateText = React.createElement("div", { className: "hp-sstate" }, tx(locale, "folded"));
  else if (seat.excluded) stateText = React.createElement("div", { className: "hp-sstate" }, tx(locale, "nextHand"));
  else if (seat.allIn) stateText = React.createElement("div", { className: "hp-sstate allin" }, tx(locale, "allIn"));

  const countdown =
    seat.isTurn && props.deadlineMs > 0 && props.secondsLeft !== null
      ? React.createElement("div", { className: "hp-count" }, tx(locale, "seconds", { n: props.secondsLeft }))
      : null;

  let cls = "hp-seat";
  if (seat.isMe) cls += " me";
  if (seat.isTurn) cls += " turn";
  if (seat.folded) cls += " folded";
  if (props.isWinner) cls += " winner";
  if (characterState !== null) cls += ` character-${characterState}`;
  if (props.className) cls += " " + props.className;

  return React.createElement(
    "div",
    {
      className: cls,
      style: props.style,
      ...(characterState === null ? {} : { "data-character-state": characterState }),
    },
    React.createElement(
      "div",
      { className: "hp-seat-head" },
      React.createElement(
        "div",
        {
          className: "hp-avatar",
          ...(character === null ? {} : { "data-character": character.id, title: character.title }),
        },
        character?.glyph ?? displayNickname(seat.nickname || "?", seat.isBot, locale).slice(0, 1).toUpperCase(),
        React.createElement(Badges, { isDealer: seat.isDealer, isSmallBlind: seat.isSmallBlind, isBigBlind: seat.isBigBlind }),
        React.createElement("div", { className: "hp-dot" + (seat.connected ? "" : " off") }),
      ),
      React.createElement("div", { className: "hp-sname" }, displayNickname(seat.nickname, seat.isBot, locale) + (seat.isMe ? (locale === "zh" ? `（${tx(locale, "you")}）` : ` (${tx(locale, "you")})`) : "")),
      seat.isBot ? React.createElement("span", { className: "hp-ai-badge" }, tx(locale, "bot")) : null,
      countdown,
    ),
    React.createElement(
      "div",
      { className: "hp-srow" },
      React.createElement("div", { className: "hp-sstack" }, fmt(seat.stack)),
      seat.bet > 0 ? React.createElement("div", { key: `bet-${seat.playerId.slice(0, 6)}-${seat.bet}`, className: "hp-sbet" }, `${tx(locale, "bet")} ${fmt(seat.bet)}`) : null,
    ),
    stateText,
    seat.lastAction !== null && seat.lastAction !== undefined
      ? React.createElement(
          "div",
          { className: "hp-last-action", "data-action": seat.lastAction.type },
          `${tx(locale, seat.lastAction.type === "allin" ? "allIn" : seat.lastAction.type as "fold" | "check" | "call" | "bet" | "raise")}${seat.lastAction.amount > 0 ? ` ${fmt(seat.lastAction.amount)}` : ""}`,
        )
      : null,
    cards,
    character !== null && characterState !== null && (characterState === "thinking" || characterState === "reacting")
      ? React.createElement("div", { className: "hp-thought", "data-character": character.id }, thought)
      : null,
    props.isWinner && props.winAmount > 0
      ? React.createElement("div", { className: "hp-win-payout", "aria-label": `+${fmt(props.winAmount)}` }, `+${fmt(props.winAmount)}`)
      : null,
  );
}

export type { SeatViewType };
