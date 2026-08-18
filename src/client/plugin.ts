/** Cordis client plugin: registers the sidebar entry and the overlay. */
import * as React from "react";
import { PokerOverlay } from "./components/PokerOverlay";
import { PokerCenterButton } from "./components/SidebarButton";

export const name = "dsh-poker";
export const inject = ["slots"];

interface SlotsLike {
  inject(slot: string, cb: () => () => void): void;
  register(opts: { name: string; id: string; order?: number; label?: string }, component: (props: any) => React.ReactNode): () => void;
}

export function apply(ctx: { get(name: string): unknown }): void {
  const slots = ctx.get("slots") as SlotsLike | undefined;
  if (slots === undefined) return;
  slots.inject("sidebar.footer.action", () =>
    slots.register({ name: "sidebar.footer.action", id: "poker-center", order: 30, label: "Poker" }, (slotProps: { wide?: boolean }) =>
      React.createElement(PokerCenterButton, { wide: slotProps.wide !== false }),
    ),
  );
  slots.inject("shell.overlay", () =>
    slots.register({ name: "shell.overlay", id: "poker-table", order: 40 }, () => React.createElement(PokerOverlay, null)),
  );
}
