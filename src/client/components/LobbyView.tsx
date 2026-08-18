/** Lobby: wallet, create form, table list (join/watch), join-by-ID. */
import * as React from "react";
import type { LobbyTable } from "../view-types";
import { createTable, joinTable, Store, useStore, watchTable } from "../store";
import { translateError, tx } from "../i18n";

export function LobbyView(): React.ReactElement {
  const store = useStore();
  const locale = store.locale;
  const [nickname, setNickname] = React.useState(store.nickname || (store.session !== null ? store.session.nickname : ""));
  const [tableName, setTableName] = React.useState("");
  const [maxSeats, setMaxSeats] = React.useState("6");
  const [buyIn, setBuyIn] = React.useState("1000");
  const [joinId, setJoinId] = React.useState("");
  const tables = (store.lobby ?? []) as LobbyTable[];
  const walletText = store.wallet === null ? "…" : String(store.wallet).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (store.connecting) {
    return React.createElement("div", { className: "hp-loading" }, React.createElement("div", { className: "hp-spinner" }), React.createElement("div", null, tx(locale, "connecting")));
  }

  const createPanel = React.createElement(
    "div",
    { className: "hp-panel" },
    React.createElement("h3", null, tx(locale, "createTable")),
    React.createElement(
      "div",
      { className: "hp-field" },
      React.createElement("label", null, tx(locale, "nickname")),
      React.createElement("input", { "data-testid": "nickname", className: "hp-input", value: nickname, maxLength: 20, onChange: (e) => setNickname(e.target.value) }),
    ),
    React.createElement(
      "div",
      { className: "hp-row" },
      React.createElement(
        "div",
        { className: "hp-field", style: { flex: 1 } },
        React.createElement("label", null, tx(locale, "tableName")),
        React.createElement("input", { "data-testid": "table-name", className: "hp-input", value: tableName, maxLength: 40, placeholder: tx(locale, "tableNamePlaceholder"), onChange: (e) => setTableName(e.target.value) }),
      ),
      React.createElement(
        "div",
        { className: "hp-field", style: { width: 88 } },
        React.createElement("label", null, tx(locale, "seats")),
        React.createElement(
          "select",
          { className: "hp-input", value: maxSeats, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setMaxSeats(e.target.value) },
          ["2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => React.createElement("option", { key: n, value: n }, n)),
        ),
      ),
    ),
    React.createElement(
      "button",
      {
        className: "hp-btn primary",
        disabled: !store.connected || nickname.trim() === "",
        onClick: () => {
          Store.set({ nickname: nickname.trim() });
          createTable(tableName.trim() || (locale === "zh" ? `扑克 ${maxSeats} 人桌` : `Poker ${maxSeats}-seat`), Number(maxSeats));
        },
      },
      tx(locale, "createTable"),
    ),
  );

  const listPanel =
    tables.length === 0
      ? React.createElement(
          "div",
          { className: "hp-panel" },
          React.createElement("h3", null, tx(locale, "openTables")),
          React.createElement(
            "div",
            { className: "hp-empty" },
            React.createElement("div", { className: "hp-bigspade" }, "♠"),
            React.createElement("div", null, tx(locale, "noTables")),
            React.createElement("div", { className: "hp-hint" }, tx(locale, "noTablesHint")),
          ),
        )
      : React.createElement(
          "div",
          { className: "hp-panel" },
          React.createElement("h3", null, tx(locale, "openTables")),
          React.createElement(
            "div",
            { className: "hp-tablelist" },
            tables.map((t) => {
              const full = t.playerCount >= t.maxSeats;
              return React.createElement(
                "div",
                { key: t.tableId, className: "hp-table-item" },
                React.createElement(
                  "div",
                  { className: "hp-tinfo" },
                  React.createElement("div", { className: "hp-tname" }, t.name),
                  React.createElement("div", { className: "hp-tmeta" }, `${t.playerCount}/${t.maxSeats} ${tx(locale, "players")} · ${tx(locale, "blinds")} ${t.smallBlind}/${t.bigBlind} · ${tx(locale, "buyIn")} ${t.buyIn}`),
                  React.createElement("div", { className: "hp-tmeta" }, `${tx(locale, "room")}${locale === "zh" ? "：" : ": "}${t.tableId}`),
                ),
                React.createElement("span", { className: `hp-badge ${t.status === "playing" ? "live" : "wait"}` }, tx(locale, t.status === "playing" ? "playing" : "waiting")),
                full
                  ? React.createElement("button", { className: "hp-btn", disabled: !store.connected, onClick: () => watchTable(t.tableId) }, tx(locale, "watch"))
                  : React.createElement(
                      "button",
                      {
                        "data-testid": `join-${t.tableId}`,
                        className: "hp-btn primary",
                        disabled: !store.connected || nickname.trim() === "",
                        onClick: () => {
                          Store.set({ nickname: nickname.trim() });
                          joinTable(t.tableId, nickname.trim() || (locale === "zh" ? "玩家" : "Player"), Number(buyIn) > 0 ? Number(buyIn) : t.buyIn);
                        },
                      },
                      tx(locale, "join"),
                    ),
              );
            }),
          ),
        );

  return React.createElement(
    "div",
    { className: "hp-lobby" },
    React.createElement(
      "div",
      { className: "hp-wallet" },
      `${tx(locale, "playTokens")}${locale === "zh" ? "：" : ": "}`,
      React.createElement("b", null, walletText),
      ` · ${tx(locale, "blinds")} 5/10 · ${tx(locale, "defaultBuyIn")} 1000`,
    ),
    React.createElement("div", { className: "hp-lobby-grid" }, createPanel, listPanel),
    React.createElement(
      "div",
      { className: "hp-panel" },
      React.createElement("h3", null, tx(locale, "joinByRoom")),
      React.createElement(
        "div",
        { className: "hp-row" },
        React.createElement("input", { "data-testid": "join-id", className: "hp-input", style: { flex: 1, minWidth: 140 }, value: joinId, placeholder: tx(locale, "pasteRoom"), onChange: (e) => setJoinId(e.target.value) }),
        React.createElement(
          "button",
          {
            className: "hp-btn primary",
            disabled: !store.connected || joinId.trim() === "" || nickname.trim() === "",
            onClick: () => {
              const id = joinId.trim();
              const meta = tables.find((t) => t.tableId === id);
              Store.set({ nickname: nickname.trim() });
              joinTable(id, nickname.trim() || (locale === "zh" ? "玩家" : "Player"), meta !== undefined ? meta.buyIn : 1000);
            },
          },
          tx(locale, "join"),
        ),
      ),
      React.createElement(
        "div",
        { className: "hp-field" },
        React.createElement("label", null, tx(locale, "buyInChips")),
        React.createElement("input", { className: "hp-input", type: "number", min: 1, value: buyIn, onChange: (e) => setBuyIn(e.target.value) }),
      ),
    ),
    React.createElement("div", { className: "hp-err" }, store.error !== null ? translateError(store.error, locale) : " "),
  );
}
