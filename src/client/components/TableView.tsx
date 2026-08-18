/** Full table view: reconnect banner + stage + showdown + action dock + history drawer. */
import * as React from "react";
import type { TableView as TableViewData } from "../view-types";
import { fmt, Store, useStore } from "../store";
import { PokerStage } from "./PokerStage";
import { ActionDock } from "./ActionDock";
import { HandHistoryDrawer } from "./HandHistoryDrawer";

export function TableView(): React.ReactElement | null {
  const store = useStore();
  const t = store.table as TableViewData | null;
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  if (t === null) return null;

  const spectating = t.mySeat === null;

  const showdown =
    t.winners.length > 0
      ? React.createElement(
          "div",
          { className: "hp-showdown" },
          React.createElement("span", { className: "w" }, `Hand #${t.handNumber}`),
          " — ",
          t.winners.map((w, i) =>
            React.createElement(
              "span",
              { key: i },
              i > 0 ? ", " : null,
              React.createElement("span", { className: "w" }, `${w.nickname} wins ${fmt(w.amount)}`),
              ` (${w.handLabel})`,
            ),
          ),
          t.reveal.length > 0
            ? React.createElement(
                "div",
                { style: { marginTop: 4 } },
                `Showdown: ${t.reveal.map((r) => `${r.nickname} [${r.cards.join(" ").toUpperCase()}] — ${r.handLabel}`).join(" · ")}`,
              )
            : null,
        )
      : null;

  return React.createElement(
    React.Fragment,
    null,
    !store.connected
      ? React.createElement("div", { className: "hp-banner warn" }, React.createElement("div", { className: "hp-dotpulse" }), "Connection lost — reconnecting…")
      : null,
    React.createElement(PokerStage, { table: t }),
    showdown,
    React.createElement(ActionDock, {
      table: t,
      spectating,
      connected: store.connected,
      nickname: store.nickname,
    }),
    React.createElement(
      "div",
      { className: "hp-history-control" },
      React.createElement("button", { className: "hp-btn hp-drawer-toggle", onClick: () => setDrawerOpen((v) => !v) }, drawerOpen ? "收起记录" : "牌局记录"),
    ),
    React.createElement(HandHistoryDrawer, { open: drawerOpen, log: t.log, onClose: () => setDrawerOpen(false) }),
  );
}

export { Store };
