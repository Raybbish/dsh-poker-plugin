/** Cordis client plugin: registers the sidebar entry and the overlay. */
import * as React from "react";
import { PokerOverlay } from "./components/PokerOverlay";
import { PokerCenterButton } from "./components/SidebarButton";
import type { HarnessStandardProps } from "./agent-status";
import { injectStyle } from "./styles";
import { disposeStore } from "./store";

export const name = "dsh-poker";
export const inject = ["slots"];

interface SlotsLike {
  inject(slot: string, cb: () => () => void): void;
  register(opts: { name: string; id: string; order?: number; label?: string }, component: (props: any) => React.ReactNode): () => void;
}

interface ClientContextLike {
  get(name: string): unknown;
  effect(effect: () => void | (() => void), label?: string): void;
}

export function apply(ctx: ClientContextLike): void {
  ctx.effect(() => injectStyle(), "dsh-poker: styles");
  ctx.effect(() => () => disposeStore(), "dsh-poker: transport");

  const slots = ctx.get("slots") as SlotsLike | undefined;
  if (slots === undefined) return;
  slots.inject("sidebar.footer.action", () =>
    slots.register({ name: "sidebar.footer.action", id: "poker-center", order: 30, label: "Poker" }, (slotProps: HarnessStandardProps & { wide?: boolean }) =>
      React.createElement(PokerCenterButton, { ...slotProps, wide: slotProps.wide !== false }),
    ),
  );
  slots.inject("shell.overlay", () =>
    slots.register({ name: "shell.overlay", id: "poker-table", order: 40 }, (slotProps: HarnessStandardProps) =>
      React.createElement(PokerOverlay as React.ComponentType<HarnessStandardProps>, slotProps),
    ),
  );
}
