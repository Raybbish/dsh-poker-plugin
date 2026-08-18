/** Overlay root: header + (lobby | table) + toast + footer. */
import * as React from "react";
import type { TableView as TableViewData } from "../view-types";
import { useStore } from "../store";
import { PokerHeader } from "./PokerHeader";
import { TableView } from "./TableView";
import { LobbyView } from "./LobbyView";
import { Spinner } from "./ui";
import { translateError, tx } from "../i18n";

export function PokerOverlay(): React.ReactElement | null {
  const store = useStore();
  if (!store.open) return null;
  const t = store.table as TableViewData | null;
  const inTable = t !== null && store.session !== null && t.tableId === store.session.tableId;
  const watching = t !== null && !inTable && t.tableId === store.spectateTableId;
  const showTable = inTable || watching;
  const showTableLoading = store.spectateTableId !== null && store.table === null;

  let body: React.ReactNode;
  if (showTableLoading) {
    body = React.createElement(Spinner, { label: tx(store.locale, "loadingTable") });
  } else if (showTable && t !== null) {
    body = React.createElement(TableView, null);
  } else {
    body = React.createElement(LobbyView, null);
  }

  return React.createElement(
    "div",
    { className: "hp-root" },
    store.error !== null ? React.createElement("div", { className: "hp-toast" }, translateError(store.error, store.locale)) : null,
    React.createElement(PokerHeader, null),
    React.createElement("div", { className: "hp-body" }, body),
  );
}
