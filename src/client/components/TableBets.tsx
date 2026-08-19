import * as React from "react";
import type { SeatView } from "../view-types";
import { fmt } from "../store";

export interface TableBetsProps {
  seats: SeatView[];
  positions: ReadonlyMap<number, { left: number; top: number }>;
  stageWidth: number;
  stageHeight: number;
  handNumber: number;
  compact: boolean;
}

/** Animate committed chips from their seat toward the centre of the felt. */
export function TableBets(props: TableBetsProps): React.ReactElement | null {
  if (props.compact) return null;
  const centre = { left: props.stageWidth / 2, top: props.stageHeight * 0.56 };
  return React.createElement(
    React.Fragment,
    null,
    props.seats.filter((seat) => seat.bet > 0).map((seat) => {
      const origin = props.positions.get(seat.seat);
      if (origin === undefined) return null;
      const left = origin.left + (centre.left - origin.left) * 0.34;
      const top = origin.top + (centre.top - origin.top) * 0.34;
      const style = {
        left,
        top,
        "--hp-chip-from-x": `${origin.left - left}px`,
        "--hp-chip-from-y": `${origin.top - top}px`,
      } as React.CSSProperties;
      return React.createElement(
        "div",
        {
          key: `${props.handNumber}-${seat.playerId}-${seat.bet}`,
          className: "hp-table-bet",
          style,
          "data-chip-player": seat.playerId,
        },
        React.createElement("i", { "aria-hidden": true }),
        React.createElement("span", null, fmt(seat.bet)),
      );
    }),
  );
}
