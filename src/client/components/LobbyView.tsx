/** Lobby: wallet, create form, table list (join/watch), join-by-ID. */
import * as React from "react";
import type { LobbyTable } from "../view-types";
import { createTable, joinTable, Store, useStore, watchTable } from "../store";

export function LobbyView(): React.ReactElement {
  const store = useStore();
  const [nickname, setNickname] = React.useState(store.nickname || (store.session !== null ? store.session.nickname : ""));
  const [tableName, setTableName] = React.useState("");
  const [maxSeats, setMaxSeats] = React.useState("6");
  const [buyIn, setBuyIn] = React.useState("1000");
  const [joinId, setJoinId] = React.useState("");
  const tables = (store.lobby ?? []) as LobbyTable[];
  const walletText = store.wallet === null ? "…" : String(store.wallet).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (store.connecting) {
    return React.createElement("div", { className: "hp-loading" }, React.createElement("div", { className: "hp-spinner" }), React.createElement("div", null, "Connecting to game server…"));
  }

  const createPanel = React.createElement(
    "div",
    { className: "hp-panel" },
    React.createElement("h3", null, "Create a table"),
    React.createElement(
      "div",
      { className: "hp-field" },
      React.createElement("label", null, "Your nickname"),
      React.createElement("input", { "data-testid": "nickname", className: "hp-input", value: nickname, maxLength: 20, onChange: (e) => setNickname(e.target.value) }),
    ),
    React.createElement(
      "div",
      { className: "hp-row" },
      React.createElement(
        "div",
        { className: "hp-field", style: { flex: 1 } },
        React.createElement("label", null, "Table name"),
        React.createElement("input", { "data-testid": "table-name", className: "hp-input", value: tableName, maxLength: 40, placeholder: "Friday Night", onChange: (e) => setTableName(e.target.value) }),
      ),
      React.createElement(
        "div",
        { className: "hp-field", style: { width: 88 } },
        React.createElement("label", null, "Seats"),
        React.createElement(
          "select",
          { className: "hp-input", value: maxSeats, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setMaxSeats(e.target.value) },
          ["2", "3", "4", "5", "6"].map((n) => React.createElement("option", { key: n, value: n }, n)),
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
          createTable(tableName.trim() || `Poker ${maxSeats}p`, Number(maxSeats));
        },
      },
      "Create table",
    ),
  );

  const listPanel =
    tables.length === 0
      ? React.createElement(
          "div",
          { className: "hp-panel" },
          React.createElement("h3", null, "Open tables"),
          React.createElement(
            "div",
            { className: "hp-empty" },
            React.createElement("div", { className: "hp-bigspade" }, "♠"),
            React.createElement("div", null, "No tables yet"),
            React.createElement("div", { className: "hp-hint" }, "Create one, or ask a friend for a room ID to join by ID."),
          ),
        )
      : React.createElement(
          "div",
          { className: "hp-panel" },
          React.createElement("h3", null, "Open tables"),
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
                  React.createElement("div", { className: "hp-tmeta" }, `${t.playerCount}/${t.maxSeats} players · blinds ${t.smallBlind}/${t.bigBlind} · buy-in ${t.buyIn}`),
                  React.createElement("div", { className: "hp-tmeta" }, `Room: ${t.tableId}`),
                ),
                React.createElement("span", { className: `hp-badge ${t.status === "playing" ? "live" : "wait"}` }, t.status === "playing" ? "playing" : "waiting"),
                full
                  ? React.createElement("button", { className: "hp-btn", disabled: !store.connected, onClick: () => watchTable(t.tableId) }, "Watch")
                  : React.createElement(
                      "button",
                      {
                        "data-testid": `join-${t.tableId}`,
                        className: "hp-btn primary",
                        disabled: !store.connected || nickname.trim() === "",
                        onClick: () => {
                          Store.set({ nickname: nickname.trim() });
                          joinTable(t.tableId, nickname.trim() || "Player", Number(buyIn) > 0 ? Number(buyIn) : t.buyIn);
                        },
                      },
                      "Join",
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
      "Play Tokens: ",
      React.createElement("b", null, walletText),
      " · blinds 5/10 · default buy-in 1000",
    ),
    React.createElement("div", { className: "hp-lobby-grid" }, createPanel, listPanel),
    React.createElement(
      "div",
      { className: "hp-panel" },
      React.createElement("h3", null, "Join by room ID"),
      React.createElement(
        "div",
        { className: "hp-row" },
        React.createElement("input", { "data-testid": "join-id", className: "hp-input", style: { flex: 1, minWidth: 140 }, value: joinId, placeholder: "paste a room ID", onChange: (e) => setJoinId(e.target.value) }),
        React.createElement(
          "button",
          {
            className: "hp-btn primary",
            disabled: !store.connected || joinId.trim() === "" || nickname.trim() === "",
            onClick: () => {
              const id = joinId.trim();
              const meta = tables.find((t) => t.tableId === id);
              Store.set({ nickname: nickname.trim() });
              joinTable(id, nickname.trim() || "Player", meta !== undefined ? meta.buyIn : 1000);
            },
          },
          "Join",
        ),
      ),
      React.createElement(
        "div",
        { className: "hp-field" },
        React.createElement("label", null, "Buy-in chips (per table)"),
        React.createElement("input", { className: "hp-input", type: "number", min: 1, value: buyIn, onChange: (e) => setBuyIn(e.target.value) }),
      ),
    ),
    React.createElement("div", { className: "hp-err" }, store.error !== null ? store.error : " "),
  );
}
