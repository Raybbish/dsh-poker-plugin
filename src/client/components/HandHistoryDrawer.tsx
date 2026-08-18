/** Collapsible hand-history drawer (right-side overlay). */
import * as React from "react";
import type { LogEntry } from "../view-types";
import { timeStr } from "../store";

export function HandHistoryDrawer(props: { open: boolean; log: LogEntry[]; onClose: () => void }): React.ReactElement | null {
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (props.open && ref.current !== null) ref.current.scrollTop = ref.current.scrollHeight;
  }, [props.open, props.log.length]);
  if (!props.open) return null;
  return React.createElement(
    "div",
    { className: "hp-drawer" },
    React.createElement(
      "div",
      { className: "hp-drawer-head" },
      React.createElement("span", null, "Hand History"),
      React.createElement("span", { className: "hp-spacer" }),
      React.createElement("button", { className: "hp-btn ghost", onClick: props.onClose }, "Close"),
    ),
    React.createElement(
      "div",
      { className: "hp-log", ref },
      props.log.map((entry, i) => {
        const cls = /wins|Showdown/i.test(entry.text) ? "good" : /folds|left|timeout/i.test(entry.text) ? "warn" : "";
        return React.createElement(
          "div",
          { key: i, className: cls },
          React.createElement("span", { className: "t" }, timeStr(entry.at)),
          entry.text,
        );
      }),
    ),
  );
}
