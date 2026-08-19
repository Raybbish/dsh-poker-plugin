/** Fixed bottom action dock: Fold / Check-Call / Bet-Raise / All-in. */
import * as React from "react";
import type { LegalAction, TableView } from "../view-types";
import { fmt, joinTable, playAction, requestAddBot, stopWatching, useStore } from "../store";
import { displayNickname, tx } from "../i18n";
import { normalizeRaiseTo, presetRaiseTo, type RaiseBounds } from "../raise-sizing";
import { RaiseSizer } from "./RaiseSizer";

export interface ActionDockProps {
  table: TableView;
  spectating: boolean;
  connected: boolean;
  nickname: string;
}

export function ActionDock(props: ActionDockProps): React.ReactElement {
  const t = props.table;
  const locale = useStore().locale;
  const mySeat = t.mySeat;
  const myTurn = mySeat !== null && mySeat === t.currentTurnSeat && props.connected;
  const [raiseTo, setRaiseTo] = React.useState(0);

  const actions: LegalAction[] = props.spectating ? [] : t.myLegalActions ?? [];
  const callAction = actions.find((a) => a.type === "call");
  const betAction = actions.find((a) => a.type === "bet");
  const raiseAction = actions.find((a) => a.type === "raise");
  const checkAction = actions.find((a) => a.type === "check");
  const canFold = actions.some((a) => a.type === "fold");
  const canAllIn = actions.some((a) => a.type === "allin");
  const callLabel = callAction !== undefined && callAction.amount !== undefined ? `${tx(locale, "call")} ${fmt(callAction.amount)}` : checkAction !== undefined ? tx(locale, "check") : null;
  const betLabel = betAction !== undefined ? tx(locale, "bet") : raiseAction !== undefined ? tx(locale, "raise") : null;
  const raiseBase = betAction !== undefined ? betAction : raiseAction;
  const potTotal = t.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const occupiedSeats = t.seats.filter((seat) => seat.playerId !== "").length;
  const full = occupiedSeats >= t.maxSeats;
  const raiseBounds: RaiseBounds | null = raiseBase === undefined
    ? null
    : {
        min: raiseBase.min ?? 1,
        max: raiseBase.max ?? raiseBase.min ?? 1,
        pot: potTotal,
        currentBet: t.toCall,
        callAmount: callAction?.amount ?? 0,
        step: 1,
        raising: raiseAction !== undefined,
      };
  const selectedAmount = raiseBounds === null
    ? 0
    : normalizeRaiseTo(raiseTo > 0 ? raiseTo : presetRaiseTo("pot", raiseBounds), raiseBounds);

  React.useEffect(() => {
    if (raiseBounds !== null) setRaiseTo(presetRaiseTo("pot", raiseBounds));
  }, [t.handNumber, t.phase, t.currentTurnSeat, t.toCall, raiseBase?.min, raiseBase?.max, potTotal]);

  const current = t.seats.find((s) => s.seat === t.currentTurnSeat);
  let hint: string;
  if (!props.connected) hint = tx(locale, "disconnectedHint");
  else if (props.spectating) hint = tx(locale, "spectatingHint");
  else if (t.phase === "idle") hint = tx(locale, "waitingOthers");
  else if (!myTurn) hint = tx(locale, "waitingPlayerAction", { name: current !== undefined ? displayNickname(current.nickname, current.isBot, locale) : tx(locale, "otherPlayer") });
  else hint = tx(locale, "yourTurn");

  if (props.spectating) {
    return React.createElement(
      "div",
      { className: "hp-dock" },
      React.createElement(
        "div",
        { className: "hp-actionrow" },
        React.createElement("button", { className: "hp-action-btn call", disabled: !props.connected, onClick: () => joinTable(t.tableId, props.nickname || (locale === "zh" ? "玩家" : "Player"), t.buyIn) }, tx(locale, "joinTable")),
        React.createElement("button", { className: "hp-btn ghost", onClick: stopWatching }, tx(locale, "backLobby")),
      ),
      React.createElement("div", { className: "hp-hint" }, hint),
    );
  }

  if (t.phase === "idle") {
    return React.createElement(
      "div",
      { className: "hp-dock" },
      React.createElement(
        "div",
        { className: "hp-actionrow" },
        React.createElement(
          "button",
          {
            "data-testid": "add-bot",
            className: "hp-action-btn bot primary-action",
            disabled: !props.connected || full,
            onClick: () => requestAddBot(t.tableId),
          },
          full ? tx(locale, "tableFull") : tx(locale, "addBot"),
        ),
      ),
      React.createElement("div", { className: "hp-hint" }, full ? tx(locale, "waitingStart") : tx(locale, "addBotHint")),
    );
  }

  return React.createElement(
    "div",
    { className: `hp-dock${myTurn ? " is-my-turn" : " is-waiting"}${raiseBounds !== null ? " has-raise" : ""}` },
    raiseBounds !== null
      ? React.createElement(RaiseSizer, {
          bounds: raiseBounds,
          value: selectedAmount,
          disabled: !myTurn,
          canAllIn,
          locale,
          onChange: setRaiseTo,
          onAllIn: () => playAction("allin"),
        })
      : null,
    React.createElement(
      "div",
      { className: "hp-actionrow" },
      React.createElement("button", { className: "hp-action-btn fold", disabled: !myTurn || !canFold, onClick: () => playAction("fold") }, tx(locale, "fold")),
      callLabel !== null
        ? React.createElement("button", { className: "hp-action-btn call", disabled: !myTurn, onClick: () => playAction(callAction !== undefined ? "call" : "check") }, callLabel)
        : null,
      betLabel !== null
        ? React.createElement(
            "button",
            {
              "data-testid": "primary-bet",
              className: "hp-action-btn bet primary-action",
              disabled: !myTurn,
              onClick: () => raiseBase !== undefined && playAction(raiseBase.type, selectedAmount),
            },
            `${betLabel} ${fmt(selectedAmount)}`,
          )
        : React.createElement("button", { className: "hp-action-btn allin primary-action", disabled: !myTurn || !canAllIn, onClick: () => playAction("allin") }, tx(locale, "allIn")),
    ),
    React.createElement(
      "div",
      { className: "hp-hint hp-hint-actions" },
      React.createElement("span", null, hint),
      React.createElement(
        "button",
        {
          "data-testid": "add-bot-active",
          className: "hp-add-bot-inline",
          disabled: !props.connected || full,
          onClick: () => requestAddBot(t.tableId),
          title: full ? tx(locale, "tableFull") : tx(locale, "botNextHand"),
        },
        full ? tx(locale, "seatsFull", { occupied: occupiedSeats, max: t.maxSeats }) : tx(locale, "addBotCompact", { occupied: occupiedSeats, max: t.maxSeats }),
      ),
    ),
  );
}
