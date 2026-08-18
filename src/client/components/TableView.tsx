/** Full table view: reconnect banner + stage + showdown + action dock + history drawer. */
import * as React from "react";
import type { TableView as TableViewData } from "../view-types";
import { fmt, Store, useStore } from "../store";
import { PokerStage } from "./PokerStage";
import { ActionDock } from "./ActionDock";
import { HandHistoryDrawer } from "./HandHistoryDrawer";
import { displayNickname, translateHandLabel, tx } from "../i18n";

export function TableView(): React.ReactElement | null {
  const store = useStore();
  const locale = store.locale;
  const t = store.table as TableViewData | null;
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  if (t === null) return null;

  const spectating = t.mySeat === null;

  const showdown =
    t.winners.length > 0
      ? React.createElement(
          "div",
          { className: "hp-showdown" },
          React.createElement("span", { className: "w" }, tx(locale, "hand", { n: t.handNumber })),
          " — ",
          t.winners.map((w, i) =>
            React.createElement(
              "span",
              { key: i },
              i > 0 ? ", " : null,
              React.createElement("span", { className: "w" }, `${displayNickname(w.nickname, /^AI Player(?: \d+)?$/.test(w.nickname), locale)} ${tx(locale, "wins")} ${fmt(w.amount)}`),
              ` (${translateHandLabel(w.handLabel, locale)})`,
            ),
          ),
          t.reveal.length > 0
            ? React.createElement(
                "div",
                { style: { marginTop: 4 } },
                `${tx(locale, "showdown")}${locale === "zh" ? "：" : ": "}${t.reveal.map((r) => `${displayNickname(r.nickname, /^AI Player(?: \d+)?$/.test(r.nickname), locale)} [${r.cards.join(" ").toUpperCase()}] — ${translateHandLabel(r.handLabel, locale)}`).join(" · ")}`,
              )
            : null,
        )
      : null;

  return React.createElement(
    React.Fragment,
    null,
    !store.connected
      ? React.createElement("div", { className: "hp-banner warn" }, React.createElement("div", { className: "hp-dotpulse" }), tx(locale, "connectionLost"))
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
      React.createElement("button", { className: "hp-btn hp-drawer-toggle", onClick: () => setDrawerOpen((v) => !v) }, tx(locale, drawerOpen ? "collapseHistory" : "handHistory")),
    ),
    React.createElement(HandHistoryDrawer, { open: drawerOpen, log: t.log, onClose: () => setDrawerOpen(false) }),
  );
}

export { Store };
