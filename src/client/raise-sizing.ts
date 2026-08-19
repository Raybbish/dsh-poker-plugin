export type RaisePreset = "min" | "half-pot" | "three-quarter-pot" | "pot" | "max";

export interface RaiseBounds {
  min: number;
  max: number;
  pot: number;
  currentBet: number;
  callAmount: number;
  step: number;
  raising: boolean;
}

export function normalizeRaiseTo(value: number, bounds: RaiseBounds): number {
  if (!Number.isFinite(value)) return bounds.min;
  const bounded = Math.max(bounds.min, Math.min(bounds.max, Math.round(value)));
  const step = Math.max(1, Math.round(bounds.step));
  const snapped = bounds.min + Math.round((bounded - bounds.min) / step) * step;
  return Math.max(bounds.min, Math.min(bounds.max, snapped));
}

export function presetRaiseTo(preset: RaisePreset, bounds: RaiseBounds): number {
  if (preset === "min") return bounds.min;
  if (preset === "max") return bounds.max;
  const fraction = preset === "half-pot" ? 0.5 : preset === "three-quarter-pot" ? 0.75 : 1;
  const potAfterCall = bounds.pot + bounds.callAmount;
  const raw = bounds.raising
    ? bounds.currentBet + potAfterCall * fraction
    : Math.max(bounds.step, bounds.pot) * fraction;
  return normalizeRaiseTo(raw, bounds);
}
