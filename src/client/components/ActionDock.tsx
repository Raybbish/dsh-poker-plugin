/** Fixed bottom action dock: Fold / Check-Call / Bet-Raise / All-in. */
import * as React from "react";
import type { LegalAction, TableView } from "../view-types";
import { addBot, fmt, joinTable, playAction, stopWatching } from "../store";

export interface ActionDockProps {
  table: TableView;
  spectating: boolean;
  connected: boolean;
  nickname: string;
}

export function ActionDock(props: ActionDockProps): React.ReactElement {
  const t = props.table;
  const mySeat = t.mySeat;
  const myTurn = mySeat !== null && mySeat === t.currentTurnSeat && props.connected;
  const [selectedRatio, setSelectedRatio] = React.useState(1.25);
  const [customAmount, setCustomAmount] = React.useState<number | null>(null);

  const actions: LegalAction[] = props.spectating ? [] : t.myLegalActions ?? [];
  const callAction = actions.find((a) => a.type === "call");
  const betAction = actions.find((a) => a.type === "bet");
  const raiseAction = actions.find((a) => a.type === "raise");
  const checkAction = actions.find((a) => a.type === "check");
  const canFold = actions.some((a) => a.type === "fold");
  const canAllIn = actions.some((a) => a.type === "allin");
  const callLabel = callAction !== undefined && callAction.amount !== undefined ? `跟注 ${fmt(callAction.amount)}` : checkAction !== undefined ? "过牌" : null;
  const betLabel = betAction !== undefined ? "下注" : raiseAction !== undefined ? "加注" : null;
  const raiseBase = betAction !== undefined ? betAction : raiseAction;
  const potTotal = t.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const occupiedSeats = t.seats.filter((seat) => seat.playerId !== "").length;
  const full = occupiedSeats >= t.maxSeats;
  const ratioAmount = (ratio: number): number => {
    if (raiseBase === undefined) return 0;
    const min = raiseBase.min ?? 1;
    const max = raiseBase.max ?? min;
    return Math.max(min, Math.min(max, Math.round(Math.max(potTotal, t.bigBlind) * ratio)));
  };
  const selectedAmount = (() => {
    if (raiseBase === undefined) return 0;
    const min = raiseBase.min ?? 1;
    const max = raiseBase.max ?? min;
    return Math.max(min, Math.min(max, Math.round(customAmount ?? ratioAmount(selectedRatio))));
  })();

  const current = t.seats.find((s) => s.seat === t.currentTurnSeat);
  let hint: string;
  if (!props.connected) hint = "连接中断，正在重连…";
  else if (props.spectating) hint = "观战中 · 入座后即可参与";
  else if (t.phase === "idle") hint = "等待其他玩家加入…";
  else if (!myTurn) hint = `等待 ${current !== undefined ? current.nickname : "其他玩家"} 操作…`;
  else hint = "轮到你了";

  if (props.spectating) {
    return React.createElement(
      "div",
      { className: "hp-dock" },
      React.createElement(
        "div",
        { className: "hp-actionrow" },
        React.createElement("button", { className: "hp-action-btn call", disabled: !props.connected, onClick: () => joinTable(t.tableId, props.nickname || "Player", t.buyIn) }, "加入牌桌"),
        React.createElement("button", { className: "hp-btn ghost", onClick: stopWatching }, "返回大厅"),
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
            onClick: () => addBot(t.tableId),
          },
          full ? "牌桌已满" : "＋ 加入 AI 机器人",
        ),
      ),
      React.createElement("div", { className: "hp-hint" }, full ? "等待牌局开始…" : "没有真人？添加 AI 后立即开局"),
    );
  }

  return React.createElement(
    "div",
    { className: "hp-dock" },
    raiseBase !== undefined
      ? React.createElement(
          "div",
          { className: "hp-bet-presets" },
          [0.33, 0.5, 0.75, 1.25].map((ratio) =>
            React.createElement(
              "button",
              {
                key: ratio,
                className: `hp-preset${customAmount === null && selectedRatio === ratio ? " selected" : ""}`,
                disabled: !myTurn,
                onClick: () => {
                  setSelectedRatio(ratio);
                  setCustomAmount(null);
                },
                title: `${fmt(ratioAmount(ratio))}`,
              },
              `${Math.round(ratio * 100)}%`,
            ),
          ),
          React.createElement("input", {
            className: "hp-preset-track",
            type: "range",
            min: raiseBase.min ?? 1,
            max: raiseBase.max ?? raiseBase.min ?? 1,
            step: 1,
            value: selectedAmount,
            disabled: !myTurn,
            "aria-label": betLabel === "加注" ? "加注金额" : "下注金额",
            onChange: (event) => setCustomAmount(Number(event.target.value)),
          }),
          React.createElement("span", { className: "hp-preset-value" }, fmt(selectedAmount)),
          canAllIn
            ? React.createElement("button", { className: "hp-preset allin", disabled: !myTurn, onClick: () => playAction("allin") }, "全下")
            : null,
        )
      : null,
    React.createElement(
      "div",
      { className: "hp-actionrow" },
      React.createElement("button", { className: "hp-action-btn fold", disabled: !myTurn || !canFold, onClick: () => playAction("fold") }, "弃牌"),
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
        : React.createElement("button", { className: "hp-action-btn allin primary-action", disabled: !myTurn || !canAllIn, onClick: () => playAction("allin") }, "全下"),
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
          onClick: () => addBot(t.tableId),
          title: full ? "牌桌已满" : "机器人将在下一手牌加入",
        },
        full ? `${occupiedSeats}/${t.maxSeats} 已满` : `＋ AI · ${occupiedSeats}/${t.maxSeats}`,
      ),
    ),
  );
}
