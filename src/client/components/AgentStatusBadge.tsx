import * as React from "react";
import type { Locale } from "../i18n";
import { tx } from "../i18n";

export function AgentStatusBadge(props: { running: boolean; locale: Locale; compact?: boolean }): React.ReactElement {
  const state = props.running ? "thinking" : "idle";
  const label = tx(props.locale, props.running ? "agentThinking" : "agentIdle");
  return React.createElement(
    "span",
    {
      className: `hp-agent-state ${state}${props.compact === true ? " compact" : ""}`,
      "data-agent-state": state,
      title: label,
    },
    React.createElement("i", { "aria-hidden": true }),
    props.compact === true ? null : label,
  );
}
