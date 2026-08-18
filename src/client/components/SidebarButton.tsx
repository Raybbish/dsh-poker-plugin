/** Sidebar entry button (DSH integration point — follows the app theme). */
import * as React from "react";
import { connect, Store, useStore } from "../store";

export function PokerCenterButton(props: { wide?: boolean }): React.ReactElement {
  const store = useStore();
  const wide = props.wide !== false;
  return React.createElement(
    "button",
    {
      className: "hp-sidebar-btn" + (store.open ? " active" : ""),
      title: "Game Center (Poker)",
      onClick: () => {
        const next = !store.open;
        Store.set({ open: next, error: null });
        if (next) connect();
      },
    },
    React.createElement("span", { className: "spade" }, "♠"),
    wide ? React.createElement("span", { className: "plabel" }, "Poker") : null,
    wide ? React.createElement("span", { className: "hp-statusdot " + (store.connected ? "on" : "off") }) : null,
  );
}
