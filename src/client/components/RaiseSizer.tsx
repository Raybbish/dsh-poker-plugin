import * as React from "react";
import type { Locale } from "../i18n";
import { tx } from "../i18n";
import { fmt } from "../store";
import { normalizeRaiseTo, presetRaiseTo, type RaiseBounds, type RaisePreset } from "../raise-sizing";

export interface RaiseSizerProps {
  bounds: RaiseBounds;
  value: number;
  disabled: boolean;
  canAllIn: boolean;
  locale: Locale;
  onChange(value: number): void;
  onAllIn(): void;
}

const PRESETS: readonly RaisePreset[] = ["min", "half-pot", "three-quarter-pot", "pot", "max"];

export function RaiseSizer(props: RaiseSizerProps): React.ReactElement {
  const [draft, setDraft] = React.useState(String(props.value));
  React.useEffect(() => setDraft(String(props.value)), [props.value]);

  const label = (preset: RaisePreset): string => {
    if (preset === "min") return tx(props.locale, "minimum");
    if (preset === "half-pot") return "½";
    if (preset === "three-quarter-pot") return "¾";
    if (preset === "pot") return tx(props.locale, "potPreset");
    return tx(props.locale, "maximum");
  };
  const select = (value: number): void => props.onChange(normalizeRaiseTo(value, props.bounds));
  const commitDraft = (): void => {
    const parsed = Number(draft.replace(/,/g, "").trim());
    if (Number.isFinite(parsed)) select(parsed);
    else setDraft(String(props.value));
  };

  return React.createElement(
    "div",
    { className: "hp-bet-presets", "aria-label": tx(props.locale, "raiseSizing") },
    React.createElement(
      "div",
      { className: "hp-raise-quick" },
      PRESETS.map((preset) => {
        const amount = presetRaiseTo(preset, props.bounds);
        return React.createElement(
          "button",
          {
            key: preset,
            type: "button",
            className: `hp-preset${props.value === amount ? " selected" : ""}`,
            disabled: props.disabled,
            "data-raise-preset": preset,
            title: fmt(amount),
            onClick: () => select(amount),
          },
          label(preset),
        );
      }),
    ),
    React.createElement("input", {
      className: "hp-preset-track",
      type: "range",
      min: props.bounds.min,
      max: props.bounds.max,
      step: Math.max(1, props.bounds.step),
      value: props.value,
      disabled: props.disabled,
      "data-testid": "raise-slider",
      "aria-label": tx(props.locale, "raiseAmount"),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => select(Number(event.currentTarget.value)),
    }),
    React.createElement(
      "label",
      { className: "hp-raise-input" },
      React.createElement("span", null, tx(props.locale, "raiseTo")),
      React.createElement("input", {
        type: "text",
        inputMode: "numeric",
        value: draft,
        disabled: props.disabled,
        "data-testid": "raise-input",
        "aria-label": tx(props.locale, "raiseAmount"),
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.currentTarget.value),
        onBlur: commitDraft,
        onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitDraft();
            event.currentTarget.blur();
          }
        },
      }),
      React.createElement("strong", null, fmt(props.value)),
    ),
    props.canAllIn
      ? React.createElement("button", { type: "button", className: "hp-preset allin", disabled: props.disabled, onClick: props.onAllIn }, tx(props.locale, "allIn"))
      : null,
  );
}
