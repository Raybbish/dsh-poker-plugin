/** Compact room bar: brand, table meta, room id, connection state, actions. */
import * as React from "react";
import type { TableView as TableViewData } from "../view-types";
import { leaveTable, setLocale, stopWatching, Store, useStore } from "../store";
import { tx } from "../i18n";

export function PokerHeader(): React.ReactElement {
  const store = useStore();
  const locale = store.locale;
  const t = store.table as TableViewData | null;
  const inTable = t !== null && store.session !== null && t.tableId === store.session.tableId;
  const watching = t !== null && !inTable && t.tableId === store.spectateTableId;
  const showMeta = inTable || watching;

  return React.createElement(
    "div",
    { className: "hp-roombar" },
    React.createElement(
      "div",
      { className: "hp-brand" },
      React.createElement("span", { className: "hp-spade" }, "♠"),
      React.createElement("span", null, tx(locale, "gameCenter")),
      React.createElement("span", { className: "hp-crumb" }, `/ ${tx(locale, "poker")}`),
    ),
    showMeta && t !== null
      ? React.createElement(
          "span",
          { className: "hp-table-meta" },
          React.createElement("span", { className: "hp-tname" }, t.name),
          React.createElement("span", { className: "hp-roomid" }, t.tableId),
          React.createElement("button", {
            className: "hp-btn",
            title: tx(locale, "copyRoomTitle"),
            onClick: () => {
              const text = t.tableId;
              if (navigator.clipboard !== undefined && navigator.clipboard.writeText !== undefined) {
                navigator.clipboard.writeText(text).catch(() => {});
              } else {
                const ta = document.createElement("textarea");
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try {
                  document.execCommand("copy");
                } catch (e) {
                  /* ignore */
                }
                document.body.removeChild(ta);
              }
            },
          }, tx(locale, "copyRoom")),
        )
      : null,
    React.createElement("div", { className: "hp-spacer" }),
    !store.connected
      ? React.createElement("span", { className: "hp-conn" }, React.createElement("div", { className: "hp-dotpulse" }), tx(locale, "reconnecting"))
      : null,
    React.createElement(
      "button",
      {
        "data-testid": "language-toggle",
        className: "hp-btn hp-language-toggle",
        title: locale === "zh" ? "Switch to English" : "切换为中文",
        onClick: () => setLocale(locale === "zh" ? "en" : "zh"),
      },
      locale === "zh" ? "English" : "中文",
    ),
    inTable ? React.createElement("button", { className: "hp-btn danger", onClick: leaveTable }, tx(locale, "leaveTable")) : null,
    watching ? React.createElement("button", { className: "hp-btn", onClick: stopWatching }, tx(locale, "backLobby")) : null,
    React.createElement("button", { className: "hp-btn", onClick: () => Store.set({ open: false }) }, tx(locale, "close")),
  );
}
