import type { Locale } from "./i18n.js";
import type { SeatView } from "./view-types.js";

export type CharacterState = "idle" | "observing" | "thinking" | "acting" | "reacting";

export interface TableCharacter {
  id: "shark" | "oracle" | "mochi" | "glitch" | "ghost";
  glyph: string;
  title: string;
  thought: string;
}

const CHARACTERS = [
  { id: "shark", glyph: "🦈", en: "Shark · pressure player", zh: "鲨鱼 · 施压型", thoughtsEn: ["Watching the current", "Smells weakness", "Pressure applied", "Clean bite"], thoughtsZh: ["观察水流", "嗅到了软弱", "开始施压", "漂亮的一口"] },
  { id: "oracle", glyph: "🦉", en: "Oracle · patient reader", zh: "先知 · 耐心读牌", thoughtsEn: ["Reading the room", "Reading the river", "The pattern fits", "As foreseen"], thoughtsZh: ["观察牌桌", "在读河牌", "牌路吻合", "正如所料"] },
  { id: "mochi", glyph: "🐼", en: "Mochi · loose caller", zh: "麻薯 · 宽松跟注", thoughtsEn: ["Keeping it light", "Cooking chaos", "Into the middle", "Sweet result"], thoughtsZh: ["轻松观察", "正在制造混乱", "送进池里", "结果很甜"] },
  { id: "glitch", glyph: "👾", en: "Glitch · volatile attacker", zh: "故障 · 激进变速", thoughtsEn: ["Sampling signals", "Rewriting the odds", "Executing branch", "Outcome accepted"], thoughtsZh: ["采样信号", "正在改写赔率", "执行分支", "接受结果"] },
  { id: "ghost", glyph: "👻", en: "Ghost · trap setter", zh: "幽灵 · 设陷型", thoughtsEn: ["Barely visible", "Setting a trap", "The trap closes", "Quietly collected"], thoughtsZh: ["藏在暗处", "正在布置陷阱", "陷阱收紧", "安静收池"] },
] as const;

/** Stable visual identity derived from seat number; never affects bot strategy. */
export function characterForSeat(seat: number, locale: Locale): TableCharacter {
  const profile = CHARACTERS[((seat - 1) % CHARACTERS.length + CHARACTERS.length) % CHARACTERS.length]!;
  return {
    id: profile.id,
    glyph: profile.glyph,
    title: locale === "zh" ? profile.zh : profile.en,
    thought: locale === "zh" ? profile.thoughtsZh[1] : profile.thoughtsEn[1],
  };
}

/** Visual-only state derived from an already-authoritative table snapshot. */
export function characterStateForSeat(seat: SeatView, phase: string, isWinner: boolean): CharacterState {
  if (isWinner) return "reacting";
  if (phase === "idle" || seat.folded || seat.excluded || !seat.connected) return "idle";
  if (seat.isTurn) return "thinking";
  if (seat.bet > 0 && (seat.lastAction?.type === "bet" || seat.lastAction?.type === "raise" || seat.lastAction?.type === "allin")) return "acting";
  return "observing";
}

export function characterThought(seat: number, state: CharacterState, locale: Locale): string {
  const profile = CHARACTERS[((seat - 1) % CHARACTERS.length + CHARACTERS.length) % CHARACTERS.length]!;
  if (state === "idle") return "";
  const index = state === "observing" ? 0 : state === "thinking" ? 1 : state === "acting" ? 2 : 3;
  return locale === "zh" ? profile.thoughtsZh[index] : profile.thoughtsEn[index];
}
