/** MatchMedia-based compact flag (mobile ≤ 640px). */
import * as React from "react";

export function useCompact(): boolean {
  const [compact, setCompact] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia === undefined) return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(mq.matches);
    update();
    if (mq.addEventListener !== undefined) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    return undefined;
  }, []);
  return compact;
}
