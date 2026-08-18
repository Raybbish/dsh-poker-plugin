/** Compact room bar: brand, table meta, room id, connection state, actions. */
import * as React from "react";
import type { TableView as TableViewData } from "../view-types";
import { leaveTable, stopWatching, Store, useStore } from "../store";

export function PokerHeader(): React.ReactElement {
  const store = useStore();
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
      React.createElement("span", null, "游戏中心"),
      React.createElement("span", { className: "hp-crumb" }, "/ 德州扑克"),
    ),
    showMeta && t !== null
      ? React.createElement(
          "span",
          { className: "hp-table-meta" },
          React.createElement("span", { className: "hp-tname" }, t.name),
          React.createElement("span", { className: "hp-roomid" }, t.tableId),
          React.createElement("button", {
            className: "hp-btn",
            title: "Copy room ID",
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
          }, "复制房间"),
        )
      : null,
    React.createElement("div", { className: "hp-spacer" }),
    !store.connected
      ? React.createElement("span", { className: "hp-conn" }, React.createElement("div", { className: "hp-dotpulse" }), "重新连接中…")
      : null,
    inTable ? React.createElement("button", { className: "hp-btn danger", onClick: leaveTable }, "离开牌桌") : null,
    watching ? React.createElement("button", { className: "hp-btn", onClick: stopWatching }, "返回大厅") : null,
    React.createElement("button", { className: "hp-btn", onClick: () => Store.set({ open: false }) }, "关闭"),
  );
}
