/** Sidebar entry button (DSH integration point — follows the app theme). */
import * as React from "react";
import { connect, Store, useStore } from "../store";
import { tx } from "../i18n";

export function PokerCenterButton(props: { wide?: boolean }): React.ReactElement {
  const store = useStore();
  const wide = props.wide !== false;
  return React.createElement(
    "button",
    {
      className: "hp-sidebar-btn" + (store.open ? " active" : ""),
      title: tx(store.locale, "sidebarTitle"),
      onClick: () => {
        const next = !store.open;
        Store.set({ open: next, error: null });
        if (next) connect();
      },
    },
    React.createElement("span", { className: "spade" }, "♠"),
    wide ? React.createElement("span", { className: "plabel" }, tx(store.locale, "poker")) : null,
    wide ? React.createElement("span", { className: "hp-statusdot " + (store.connected ? "on" : "off") }) : null,
  );
}
