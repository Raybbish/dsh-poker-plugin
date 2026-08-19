window.__ModuleLoader__.load({
  id: "dsh-poker",
  factory: (require) => {
    "use strict";
    var module = { exports: {} };
    var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/entry.ts
var entry_exports = {};
__export(entry_exports, {
  __test: () => __test,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(entry_exports);

// src/client/plugin.ts
var React18 = __toESM(require("react"), 1);

// src/client/components/PokerOverlay.tsx
var React16 = __toESM(require("react"), 1);

// src/client/store.ts
var React = __toESM(require("react"), 1);

// src/client/i18n.ts
var STORAGE_KEY = "dsh-poker-locale";
var zh = {
  gameCenter: "\u6E38\u620F\u4E2D\u5FC3",
  poker: "\u5FB7\u5DDE\u6251\u514B",
  connecting: "\u6B63\u5728\u8FDE\u63A5\u6E38\u620F\u670D\u52A1\u5668\u2026",
  createTable: "\u521B\u5EFA\u724C\u684C",
  nickname: "\u4F60\u7684\u6635\u79F0",
  tableName: "\u724C\u684C\u540D\u79F0",
  tableNamePlaceholder: "\u5468\u4E94\u724C\u5C40",
  seats: "\u5EA7\u4F4D\u6570",
  openTables: "\u5F00\u653E\u724C\u684C",
  noTables: "\u6682\u65F6\u6CA1\u6709\u724C\u684C",
  noTablesHint: "\u521B\u5EFA\u4E00\u684C\uFF0C\u6216\u8F93\u5165\u670B\u53CB\u53D1\u6765\u7684\u623F\u95F4 ID\u3002",
  players: "\u540D\u73A9\u5BB6",
  blinds: "\u76F2\u6CE8",
  buyIn: "\u4E70\u5165",
  room: "\u623F\u95F4",
  playing: "\u6E38\u620F\u4E2D",
  paused: "\u5DF2\u6682\u505C",
  waiting: "\u7B49\u5F85\u4E2D",
  watch: "\u89C2\u6218",
  join: "\u52A0\u5165",
  playTokens: "\u6E38\u620F\u7B79\u7801",
  defaultBuyIn: "\u9ED8\u8BA4\u4E70\u5165",
  joinByRoom: "\u901A\u8FC7\u623F\u95F4 ID \u52A0\u5165",
  pasteRoom: "\u7C98\u8D34\u623F\u95F4 ID",
  buyInChips: "\u4E70\u5165\u7B79\u7801\uFF08\u6BCF\u684C\uFF09",
  copyRoom: "\u590D\u5236\u623F\u95F4",
  copyRoomTitle: "\u590D\u5236\u623F\u95F4 ID",
  reconnecting: "\u6B63\u5728\u91CD\u65B0\u8FDE\u63A5\u2026",
  leaveTable: "\u79BB\u5F00\u724C\u684C",
  backLobby: "\u8FD4\u56DE\u5927\u5385",
  close: "\u5173\u95ED",
  loadingTable: "\u6B63\u5728\u8F7D\u5165\u724C\u684C\u2026",
  connectionLost: "\u8FDE\u63A5\u5DF2\u65AD\u5F00\uFF0C\u6B63\u5728\u91CD\u65B0\u8FDE\u63A5\u2026",
  phaseIdle: "\u7B49\u5F85\u5165\u5EA7",
  phasePreflop: "\u7FFB\u724C\u524D",
  phaseFlop: "\u7FFB\u724C",
  phaseTurn: "\u8F6C\u724C",
  phaseRiver: "\u6CB3\u724C",
  phaseShowdown: "\u644A\u724C",
  hand: "\u7B2C {n} \u624B",
  pot: "\u5E95\u6C60",
  waitingPlayers: "\u7B49\u5F85\u73A9\u5BB6\u5165\u5EA7",
  inviteHint: "{seated}/{max} \u4EBA \xB7 \u590D\u5236\u623F\u95F4 ID \u9080\u8BF7\u670B\u53CB",
  folded: "\u5DF2\u5F03\u724C",
  nextHand: "\u7B49\u5F85\u4E0B\u4E00\u624B",
  allIn: "\u5168\u4E0B",
  you: "\u4F60",
  bot: "\u673A\u5668\u4EBA",
  seconds: "{n} \u79D2",
  bet: "\u4E0B\u6CE8",
  raise: "\u52A0\u6CE8",
  call: "\u8DDF\u6CE8",
  check: "\u8FC7\u724C",
  fold: "\u5F03\u724C",
  joinTable: "\u52A0\u5165\u724C\u684C",
  disconnectedHint: "\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u6B63\u5728\u91CD\u8FDE\u2026",
  spectatingHint: "\u6B63\u5728\u89C2\u6218 \xB7 \u5165\u5EA7\u540E\u5373\u53EF\u53C2\u4E0E",
  waitingOthers: "\u7B49\u5F85\u5176\u4ED6\u73A9\u5BB6\u52A0\u5165\u2026",
  waitingPlayerAction: "\u7B49\u5F85 {name} \u64CD\u4F5C\u2026",
  otherPlayer: "\u5176\u4ED6\u73A9\u5BB6",
  yourTurn: "\u8F6E\u5230\u4F60\u4E86",
  tableFull: "\u724C\u684C\u5DF2\u6EE1",
  addBot: "\uFF0B \u52A0\u5165\u673A\u5668\u4EBA",
  waitingStart: "\u7B49\u5F85\u724C\u5C40\u5F00\u59CB\u2026",
  addBotHint: "\u6CA1\u6709\u771F\u4EBA\uFF1F\u6DFB\u52A0\u673A\u5668\u4EBA\u540E\u7ACB\u5373\u5F00\u5C40",
  betAmount: "\u4E0B\u6CE8\u91D1\u989D",
  raiseAmount: "\u52A0\u6CE8\u91D1\u989D",
  raiseSizing: "\u8C03\u6574\u52A0\u6CE8\u91D1\u989D",
  raiseTo: "\u52A0\u6CE8\u81F3",
  minimum: "\u6700\u5C0F",
  maximum: "\u6700\u5927",
  potPreset: "\u5E95\u6C60",
  botNextHand: "\u673A\u5668\u4EBA\u5C06\u5728\u4E0B\u4E00\u624B\u724C\u52A0\u5165",
  seatsFull: "{occupied}/{max} \u5DF2\u6EE1",
  addBotCompact: "\uFF0B \u673A\u5668\u4EBA \xB7 {occupied}/{max}",
  collapseHistory: "\u6536\u8D77\u8BB0\u5F55",
  handHistory: "\u724C\u5C40\u8BB0\u5F55",
  wins: "\u8D62\u5F97",
  showdown: "\u644A\u724C",
  sidebarTitle: "\u6E38\u620F\u4E2D\u5FC3\uFF08\u5FB7\u5DDE\u6251\u514B\uFF09",
  agentThinking: "Agent \u601D\u8003\u4E2D",
  agentIdle: "Agent \u7A7A\u95F2",
  aiSettings: "AI \u8BBE\u7F6E",
  aiConfigured: "AI \u5DF2\u914D\u7F6E",
  aiSettingsHint: "\u5728\u672C\u673A\u914D\u7F6E DeepSeek API Key\uFF0C\u7528\u4E8E\u724C\u684C\u673A\u5668\u4EBA\u51B3\u7B56\u3002",
  deepSeekApiKey: "DeepSeek API Key",
  replaceAiKey: "\u8F93\u5165\u65B0 Key \u4EE5\u66FF\u6362\u5F53\u524D\u914D\u7F6E",
  aiMemoryOnly: "Key \u4EC5\u4FDD\u5B58\u5728\u5F53\u524D\u670D\u52A1\u8FDB\u7A0B\u5185\u5B58\u4E2D\uFF0C\u9875\u9762\u65E0\u6CD5\u56DE\u8BFB\uFF1B\u670D\u52A1\u91CD\u542F\u540E\u9700\u8981\u91CD\u65B0\u586B\u5199\u3002",
  aiKeyTooShort: "\u8BF7\u8F93\u5165\u6709\u6548\u7684 API Key",
  aiKeySendFailed: "\u8FDE\u63A5\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8FDE\u540E\u518D\u8BD5",
  cancel: "\u53D6\u6D88",
  saveAiKey: "\u4FDD\u5B58\u8BBE\u7F6E",
  saveAndAddBot: "\u4FDD\u5B58\u5E76\u52A0\u5165\u673A\u5668\u4EBA",
  savingAiKey: "\u6B63\u5728\u4FDD\u5B58\u2026",
  deleteRoom: "\u5220\u9664\u623F\u95F4",
  confirmDelete: "\u786E\u8BA4\u5220\u9664",
  cancelDelete: "\u53D6\u6D88",
  deleteRoomWarning: "\u5220\u9664\u540E\u5C06\u53D6\u6D88\u5F53\u524D\u724C\u5C40\uFF0C\u5E76\u628A\u6BCF\u4F4D\u73A9\u5BB6\u73B0\u6709\u7684\u684C\u4E0A\u7B79\u7801\u539F\u989D\u9000\u56DE\u3002"
};
var en = {
  gameCenter: "Game Center",
  poker: "Texas Hold'em",
  connecting: "Connecting to game server\u2026",
  createTable: "Create a table",
  nickname: "Your nickname",
  tableName: "Table name",
  tableNamePlaceholder: "Friday Night",
  seats: "Seats",
  openTables: "Open tables",
  noTables: "No tables yet",
  noTablesHint: "Create one, or enter a room ID shared by a friend.",
  players: "players",
  blinds: "blinds",
  buyIn: "buy-in",
  room: "Room",
  playing: "playing",
  paused: "paused",
  waiting: "waiting",
  watch: "Watch",
  join: "Join",
  playTokens: "Play Tokens",
  defaultBuyIn: "default buy-in",
  joinByRoom: "Join by room ID",
  pasteRoom: "paste a room ID",
  buyInChips: "Buy-in chips (per table)",
  copyRoom: "Copy room",
  copyRoomTitle: "Copy room ID",
  reconnecting: "Reconnecting\u2026",
  leaveTable: "Leave table",
  backLobby: "Back to lobby",
  close: "Close",
  loadingTable: "Loading table\u2026",
  connectionLost: "Connection lost \u2014 reconnecting\u2026",
  phaseIdle: "Waiting for players",
  phasePreflop: "Pre-flop",
  phaseFlop: "Flop",
  phaseTurn: "Turn",
  phaseRiver: "River",
  phaseShowdown: "Showdown",
  hand: "Hand #{n}",
  pot: "Pot",
  waitingPlayers: "Waiting for players",
  inviteHint: "{seated}/{max} seated \xB7 copy the room ID to invite friends",
  folded: "Folded",
  nextHand: "Waiting for next hand",
  allIn: "All-in",
  you: "you",
  bot: "Bot",
  seconds: "{n}s",
  bet: "Bet",
  raise: "Raise",
  call: "Call",
  check: "Check",
  fold: "Fold",
  joinTable: "Join table",
  disconnectedHint: "Connection lost \u2014 reconnecting\u2026",
  spectatingHint: "Spectating \xB7 take a seat to play",
  waitingOthers: "Waiting for other players\u2026",
  waitingPlayerAction: "Waiting for {name}\u2026",
  otherPlayer: "another player",
  yourTurn: "Your turn",
  tableFull: "Table full",
  addBot: "+ Add bot",
  waitingStart: "Waiting for the game to start\u2026",
  addBotHint: "No one else here? Add a bot to start now",
  betAmount: "Bet amount",
  raiseAmount: "Raise amount",
  raiseSizing: "Raise sizing",
  raiseTo: "Raise to",
  minimum: "Min",
  maximum: "Max",
  potPreset: "Pot",
  botNextHand: "The bot will join the next hand",
  seatsFull: "{occupied}/{max} full",
  addBotCompact: "+ Bot \xB7 {occupied}/{max}",
  collapseHistory: "Hide history",
  handHistory: "Hand History",
  wins: "wins",
  showdown: "Showdown",
  sidebarTitle: "Game Center (Texas Hold'em)",
  agentThinking: "Agent thinking",
  agentIdle: "Agent idle",
  aiSettings: "AI settings",
  aiConfigured: "AI configured",
  aiSettingsHint: "Configure a DeepSeek API key on this computer for poker bot decisions.",
  deepSeekApiKey: "DeepSeek API key",
  replaceAiKey: "Enter a new key to replace the current one",
  aiMemoryOnly: "The key stays only in this server process's memory and cannot be read back by the page. Enter it again after a restart.",
  aiKeyTooShort: "Enter a valid API key",
  aiKeySendFailed: "The connection is unavailable. Reconnect and try again.",
  cancel: "Cancel",
  saveAiKey: "Save settings",
  saveAndAddBot: "Save and add bot",
  savingAiKey: "Saving\u2026",
  deleteRoom: "Delete room",
  confirmDelete: "Confirm delete",
  cancelDelete: "Cancel",
  deleteRoomWarning: "Deleting cancels the current hand and refunds each player's current table chips."
};
function tx(locale, key, values = {}) {
  const template = (locale === "zh" ? zh : en)[key];
  return template.replace(/\{(\w+)\}/g, (_match, name2) => String(values[name2] ?? ""));
}
function readLocale() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh";
  } catch (_error) {
    return "zh";
  }
}
function writeLocale(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch (_error) {
  }
}
function displayNickname(nickname, isBot, locale) {
  if (!isBot || locale === "en") return nickname;
  const match = /^AI Player(?: (\d+))?$/.exec(nickname);
  if (match === null) return nickname;
  return match[1] === void 0 ? "\u673A\u5668\u4EBA" : `\u673A\u5668\u4EBA ${match[1]}`;
}
function translateHandLabel(label, locale) {
  if (locale === "en") return label;
  const rules = [
    [/^Royal Flush$/, () => "\u7687\u5BB6\u540C\u82B1\u987A"],
    [/^Straight Flush, (.+) high$/, (_all, rank) => `${rank} \u9AD8\u540C\u82B1\u987A`],
    [/^Four of a Kind, (.+)s$/, (_all, rank) => `${rank} \u56DB\u6761`],
    [/^Full House, (.+)s over (.+)s$/, (_all, trips, pair) => `${trips} \u846B\u82A6\uFF08\u5E26 ${pair} \u5BF9\uFF09`],
    [/^Flush, (.+) high$/, (_all, rank) => `${rank} \u9AD8\u540C\u82B1`],
    [/^Straight, (.+) high$/, (_all, rank) => `${rank} \u9AD8\u987A\u5B50`],
    [/^Three of a Kind, (.+)s$/, (_all, rank) => `${rank} \u4E09\u6761`],
    [/^Two Pair, (.+)s and (.+)s$/, (_all, high, low) => `\u4E24\u5BF9\uFF08${high} \u548C ${low}\uFF09`],
    [/^Pair of (.+)s$/, (_all, rank) => `${rank} \u5BF9`],
    [/^High Card (.+)$/, (_all, rank) => `${rank} \u9AD8\u724C`]
  ];
  for (const [pattern, render] of rules) {
    const match = pattern.exec(label);
    if (match !== null) return render(...match);
  }
  return label;
}
function botNames(text, locale) {
  if (locale === "en") return text;
  return text.replace(/AI Player(?: \d+)?/g, (name2) => displayNickname(name2, true, locale));
}
function translateLog(text, locale) {
  if (locale === "en") return text;
  const source = botNames(text, locale);
  const rules = [
    [/^Table "(.+)" created \(blinds (\d+)\/(\d+), buy-in (\d+)\)\.$/, (_a, name2, sb, bb, buyIn) => `\u724C\u684C\u201C${name2}\u201D\u5DF2\u521B\u5EFA\uFF08\u76F2\u6CE8 ${sb}/${bb}\uFF0C\u4E70\u5165 ${buyIn}\uFF09\u3002`],
    [/^(.+) joined at seat (\d+) \(AI, buy-in (\d+)\)\.$/, (_a, name2, seat, buyIn) => `${name2} \u4F5C\u4E3A\u673A\u5668\u4EBA\u52A0\u5165 ${seat} \u53F7\u5EA7\u4F4D\uFF08\u4E70\u5165 ${buyIn}\uFF09\u3002`],
    [/^(.+) joined at seat (\d+) \(buy-in (\d+)\)\.$/, (_a, name2, seat, buyIn) => `${name2} \u52A0\u5165 ${seat} \u53F7\u5EA7\u4F4D\uFF08\u4E70\u5165 ${buyIn}\uFF09\u3002`],
    [/^(.+) left the table \(cashed out (\d+)\)\.$/, (_a, name2, amount) => `${name2} \u79BB\u5F00\u724C\u684C\uFF08\u5151\u56DE ${amount}\uFF09\u3002`],
    [/^Waiting for at least 2 players to start a hand\.$/, () => "\u81F3\u5C11\u9700\u8981 2 \u540D\u73A9\u5BB6\u624D\u80FD\u5F00\u59CB\u724C\u5C40\u3002"],
    [/^Hand #(\d+) started — dealer: (.+)\. Blinds (\d+)\/(\d+)\.$/, (_a, hand, dealer, sb, bb) => `\u7B2C ${hand} \u624B\u5F00\u59CB\u2014\u2014\u5E84\u5BB6\uFF1A${dealer}\u3002\u76F2\u6CE8 ${sb}/${bb}\u3002`],
    [/^(.+) folds\.$/, (_a, name2) => `${name2} \u5F03\u724C\u3002`],
    [/^(.+) checks\.$/, (_a, name2) => `${name2} \u8FC7\u724C\u3002`],
    [/^(.+) calls all-in \((\d+)\)\.$/, (_a, name2, amount) => `${name2} \u8DDF\u6CE8\u5E76\u5168\u4E0B\uFF08${amount}\uFF09\u3002`],
    [/^(.+) calls (\d+)\.$/, (_a, name2, amount) => `${name2} \u8DDF\u6CE8 ${amount}\u3002`],
    [/^(.+) bets (\d+)\.$/, (_a, name2, amount) => `${name2} \u4E0B\u6CE8 ${amount}\u3002`],
    [/^(.+) raises to (\d+)\.$/, (_a, name2, amount) => `${name2} \u52A0\u6CE8\u5230 ${amount}\u3002`],
    [/^(.+) is all-in for (\d+)\.$/, (_a, name2, amount) => `${name2} \u5168\u4E0B ${amount}\u3002`],
    [/^(.+) left the hand \((.+)\)\.$/, (_a, name2, reason) => `${name2} \u79BB\u5F00\u672C\u624B\u724C\uFF08${reason === "left the table" ? "\u79BB\u5F00\u724C\u684C" : reason === "last human left" ? "\u6700\u540E\u4E00\u540D\u771F\u4EBA\u5DF2\u79BB\u5F00" : reason}\uFF09\u3002`],
    [/^(.+) auto-folds \(timeout\)\.$/, (_a, name2) => `${name2} \u8D85\u65F6\u81EA\u52A8\u5F03\u724C\u3002`],
    [/^(.+) auto-checks \(timeout\)\.$/, (_a, name2) => `${name2} \u8D85\u65F6\u81EA\u52A8\u8FC7\u724C\u3002`],
    [/^Flop dealt\.$/, () => "\u5DF2\u53D1\u7FFB\u724C\u3002"],
    [/^Turn dealt\.$/, () => "\u5DF2\u53D1\u8F6C\u724C\u3002"],
    [/^River dealt\.$/, () => "\u5DF2\u53D1\u6CB3\u724C\u3002"],
    [/^All-in runout: flop dealt\.$/, () => "\u5168\u4E0B\u53D1\u724C\uFF1A\u5DF2\u53D1\u7FFB\u724C\u3002"],
    [/^All-in runout: turn dealt\.$/, () => "\u5168\u4E0B\u53D1\u724C\uFF1A\u5DF2\u53D1\u8F6C\u724C\u3002"],
    [/^All-in runout: river dealt\.$/, () => "\u5168\u4E0B\u53D1\u724C\uFF1A\u5DF2\u53D1\u6CB3\u724C\u3002"],
    [/^(.+) wins (\d+) — everyone else folded\.$/, (_a, name2, amount) => `${name2} \u8D62\u5F97 ${amount}\u2014\u2014\u5176\u4ED6\u73A9\u5BB6\u5747\u5DF2\u5F03\u724C\u3002`],
    [/^Showdown: (.+)\.$/, (_a, result) => `\u644A\u724C\uFF1A${result.replace(/ wins /g, " \u8D62\u5F97 ")}\u3002`],
    [/^Showdown$/, () => "\u644A\u724C"],
    [/^Hand #(\d+) finished\.$/, (_a, hand) => `\u7B2C ${hand} \u624B\u7ED3\u675F\u3002`],
    [/^Hand #(\d+) started\.$/, (_a, hand) => `\u7B2C ${hand} \u624B\u5F00\u59CB\u3002`]
  ];
  for (const [pattern, render] of rules) {
    const match = pattern.exec(source);
    if (match !== null) return render(...match);
  }
  return source;
}
var ERROR_ZH = {
  "WebSocket unavailable": "\u65E0\u6CD5\u4F7F\u7528\u7F51\u7EDC\u8FDE\u63A5",
  "invalid message": "\u8BF7\u6C42\u5185\u5BB9\u65E0\u6548",
  "session expired \u2014 join the table again": "\u4F1A\u8BDD\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u52A0\u5165\u724C\u684C",
  "hand already in progress": "\u672C\u624B\u724C\u5DF2\u7ECF\u5F00\u59CB",
  "no hand in progress": "\u5F53\u524D\u6CA1\u6709\u8FDB\u884C\u4E2D\u7684\u724C\u5C40",
  "player not in hand": "\u4F60\u4E0D\u5728\u672C\u624B\u724C\u4E2D",
  "player is not active": "\u5F53\u524D\u73A9\u5BB6\u4E0D\u80FD\u64CD\u4F5C",
  "player is all-in": "\u73A9\u5BB6\u5DF2\u7ECF\u5168\u4E0B",
  "not your turn": "\u8FD8\u6CA1\u8F6E\u5230\u4F60",
  "cannot check when facing a bet": "\u9762\u5BF9\u4E0B\u6CE8\u65F6\u4E0D\u80FD\u8FC7\u724C",
  "cannot bet when facing a bet": "\u9762\u5BF9\u4E0B\u6CE8\u65F6\u53EA\u80FD\u52A0\u6CE8",
  "cannot raise without a bet to raise": "\u5F53\u524D\u6CA1\u6709\u53EF\u52A0\u6CE8\u7684\u4E0B\u6CE8",
  "betting is not open for this player (short all-in did not reopen)": "\u77ED\u7801\u5168\u4E0B\u672A\u91CD\u65B0\u5F00\u653E\u52A0\u6CE8",
  "join the table before adding a bot": "\u8BF7\u5148\u52A0\u5165\u724C\u684C\uFF0C\u518D\u6DFB\u52A0\u673A\u5668\u4EBA",
  "table is full": "\u724C\u684C\u5DF2\u6EE1",
  "not seated at this table": "\u4F60\u6CA1\u6709\u5728\u8FD9\u5F20\u724C\u684C\u5165\u5EA7",
  "not authenticated": "\u8EAB\u4EFD\u9A8C\u8BC1\u5931\u8D25",
  "identity mismatch": "\u8EAB\u4EFD\u4FE1\u606F\u4E0D\u5339\u914D",
  "identity token mismatch": "\u8EAB\u4EFD\u4EE4\u724C\u4E0D\u5339\u914D",
  "only a seated player can add a bot": "\u53EA\u6709\u5DF2\u5165\u5EA7\u7684\u771F\u4EBA\u73A9\u5BB6\u53EF\u4EE5\u6DFB\u52A0\u673A\u5668\u4EBA",
  "already seated at this table": "\u4F60\u5DF2\u7ECF\u5728\u8FD9\u5F20\u724C\u684C\u5165\u5EA7",
  "buy-in must be positive": "\u4E70\u5165\u91D1\u989D\u5FC5\u987B\u5927\u4E8E\u96F6",
  "buy-in too large": "\u4E70\u5165\u91D1\u989D\u8FC7\u9AD8",
  "player is leaving": "\u73A9\u5BB6\u6B63\u5728\u79BB\u5F00\u724C\u684C",
  "table not found": "\u6CA1\u6709\u627E\u5230\u8BE5\u724C\u684C",
  "bot wallet too low": "\u673A\u5668\u4EBA\u7B79\u7801\u4E0D\u8DB3",
  "AI bot is unavailable \u2014 configure a server-side API key and restart dsh web": "\u673A\u5668\u4EBA\u4E0D\u53EF\u7528\u2014\u2014\u8BF7\u914D\u7F6E\u670D\u52A1\u5668\u7AEF API \u5BC6\u94A5\u5E76\u91CD\u542F\u670D\u52A1",
  "AI bot is unavailable \u2014 configure an API key": "\u673A\u5668\u4EBA\u4E0D\u53EF\u7528\u2014\u2014\u8BF7\u5148\u914D\u7F6E API Key",
  "AI settings can only be changed from this computer": "\u53EA\u80FD\u5728\u8FD0\u884C\u670D\u52A1\u7684\u8FD9\u53F0\u7535\u8111\u4E0A\u4FEE\u6539 AI \u8BBE\u7F6E",
  "Rooms can only be deleted from this computer": "\u53EA\u80FD\u5728\u8FD0\u884C\u670D\u52A1\u7684\u8FD9\u53F0\u7535\u8111\u4E0A\u5220\u9664\u623F\u95F4"
};
function translateError(message, locale) {
  if (locale === "en") return message;
  const exact = ERROR_ZH[message];
  if (exact !== void 0) return exact;
  let match = /^bet must be between (\d+) and (\d+)$/.exec(message);
  if (match !== null) return `\u4E0B\u6CE8\u91D1\u989D\u5FC5\u987B\u5728 ${match[1]} \u5230 ${match[2]} \u4E4B\u95F4`;
  match = /^raise must be between (\d+) and (\d+)$/.exec(message);
  if (match !== null) return `\u52A0\u6CE8\u91D1\u989D\u5FC5\u987B\u5728 ${match[1]} \u5230 ${match[2]} \u4E4B\u95F4`;
  match = /^wallet too low: (\d+) < (\d+)$/.exec(message);
  if (match !== null) return `\u7B79\u7801\u4F59\u989D\u4E0D\u8DB3\uFF1A${match[1]}\uFF0C\u9700\u8981 ${match[2]}`;
  if (/^stale command/.test(message) || /^stale-version/.test(message)) return "\u724C\u5C40\u72B6\u6001\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u8BD5";
  return botNames(message, locale);
}

// src/client/store.ts
var Store = {
  locale: readLocale(),
  open: false,
  ws: null,
  connecting: false,
  retryTimer: null,
  retry: 0,
  connected: false,
  session: readSession(),
  nickname: "",
  lobby: [],
  table: null,
  spectateTableId: null,
  wallet: null,
  botConfigured: null,
  botConfigurable: false,
  botConfigurationRequestId: null,
  aiSettingsOpen: false,
  aiSettingsTableId: null,
  error: null,
  listeners: /* @__PURE__ */ new Set(),
  subscribe(fn) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  },
  emit() {
    for (const fn of [...this.listeners]) {
      try {
        fn();
      } catch (e) {
        console.error("poker store listener", e);
      }
    }
  },
  set(patch) {
    Object.assign(this, patch);
    if (typeof window !== "undefined") window.__hpStore = { ...this, listeners: void 0 };
    this.emit();
  }
};
function setLocale(locale) {
  writeLocale(locale);
  Store.set({ locale });
}
function useStore() {
  const force = React.useReducer((x) => x + 1, 0)[1];
  React.useEffect(() => Store.subscribe(force), []);
  return Store;
}
var seq = 0;
function rid() {
  return "r" + (++seq).toString(36) + Date.now().toString(36);
}
function cardLabel(rank) {
  return rank === 14 ? "A" : rank === 13 ? "K" : rank === 12 ? "Q" : rank === 11 ? "J" : rank === 10 ? "T" : String(rank);
}
function suitChar(suit) {
  return suit === 0 ? "\u2663" : suit === 1 ? "\u2666" : suit === 2 ? "\u2665" : "\u2660";
}
function suitRed(suit) {
  return suit === 1 || suit === 2;
}
function fmt(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function timeStr(at) {
  const d = new Date(at);
  const p = (x) => x < 10 ? "0" + x : "" + x;
  return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}
function readSession() {
  try {
    const raw = localStorage.getItem("dsh-poker-session");
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s.playerId === "string" && typeof s.token === "string") return s;
  } catch (e) {
  }
  return null;
}
function writeSession(s) {
  try {
    if (s === null) localStorage.removeItem("dsh-poker-session");
    else localStorage.setItem("dsh-poker-session", JSON.stringify(s));
  } catch (e) {
  }
}
function connect() {
  if (Store.ws !== null || Store.connecting) return;
  Store.set({ connecting: true, error: null });
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  let ws;
  try {
    ws = new WebSocket(proto + "//" + location.host + "/poker/ws");
  } catch (e) {
    Store.set({ connecting: false, error: "WebSocket unavailable" });
    return;
  }
  Store.ws = ws;
  ws.onopen = () => {
    Store.set({ connected: true, connecting: false, retry: 0, error: null });
    send({ type: "joinLobby", requestId: rid() });
    if (Store.session !== null) {
      send({ type: "resume", requestId: rid(), playerId: Store.session.playerId, token: Store.session.token, tableId: Store.session.tableId });
    }
  };
  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(String(ev.data));
    } catch (e) {
      console.error("poker: bad message", ev.data);
      return;
    }
    handleMessage(msg);
  };
  ws.onclose = () => {
    Store.set({ ws: null, connecting: false, connected: false });
    if (Store.open) scheduleReconnect();
  };
  ws.onerror = () => {
    try {
      ws.close();
    } catch (e) {
    }
  };
}
function disposeStore() {
  if (Store.retryTimer !== null) clearTimeout(Store.retryTimer);
  const ws = Store.ws;
  Store.retryTimer = null;
  Store.ws = null;
  Store.connecting = false;
  Store.connected = false;
  Store.retry = 0;
  Store.listeners.clear();
  if (ws === null) return;
  ws.onopen = null;
  ws.onmessage = null;
  ws.onclose = null;
  ws.onerror = null;
  try {
    ws.close();
  } catch (e) {
  }
}
function scheduleReconnect() {
  if (Store.retryTimer !== null) return;
  Store.retryTimer = setTimeout(() => {
    Store.retryTimer = null;
    Store.retry = Math.min(Store.retry + 1, 6);
    connect();
  }, Math.min(1e3 * Math.pow(2, Store.retry), 15e3));
}
function send(msg) {
  const ws = Store.ws;
  if (ws === null || ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(JSON.stringify(msg));
    return true;
  } catch (e) {
    return false;
  }
}
function handleMessage(msg) {
  switch (msg.type) {
    case "pong":
      return;
    case "lobby":
      Store.set({ lobby: msg.tables });
      return;
    case "joined": {
      const session = { playerId: msg.playerId, token: msg.token, tableId: msg.tableId, nickname: Store.nickname || "Player" };
      Store.set({ session, spectateTableId: null });
      writeSession(session);
      return;
    }
    case "snapshot":
      Store.set({ table: msg.table });
      return;
    case "wallet":
      Store.set({ wallet: msg.balance });
      return;
    case "botConfiguration":
      Store.set({
        botConfigured: msg.configured === true,
        botConfigurable: msg.configurable === true,
        botConfigurationRequestId: typeof msg.requestId === "string" ? msg.requestId : null
      });
      return;
    case "tableDeleted": {
      const removedSession = Store.session?.tableId === msg.tableId;
      if (removedSession) writeSession(null);
      Store.set({
        session: removedSession ? null : Store.session,
        table: Store.table?.tableId === msg.tableId ? null : Store.table,
        spectateTableId: Store.spectateTableId === msg.tableId ? null : Store.spectateTableId
      });
      return;
    }
    case "error": {
      Store.set({ error: msg.message || msg.code });
      if (msg.code === "resume-failed") {
        writeSession(null);
        Store.set({ session: null, table: null });
      }
      setTimeout(() => {
        if (Store.error === (msg.message || msg.code)) Store.set({ error: null });
      }, 5e3);
      return;
    }
    default:
      return;
  }
}
function createTable(name2, maxSeats) {
  send({ type: "createTable", requestId: rid(), name: name2, maxSeats });
}
function joinTable(tableId, nickname, buyIn) {
  const msg = { type: "joinTable", requestId: rid(), tableId, nickname, buyIn };
  if (Store.session !== null) {
    msg.playerId = Store.session.playerId;
    msg.token = Store.session.token;
  }
  Store.set({ nickname });
  send(msg);
}
function leaveTable() {
  if (Store.session === null || Store.table === null) return;
  send({ type: "leaveTable", requestId: rid(), tableId: Store.table.tableId });
  Store.set({ session: null, table: null, spectateTableId: null });
  writeSession(null);
  send({ type: "joinLobby", requestId: rid() });
}
function addBot(tableId) {
  send({ type: "addBot", requestId: rid(), tableId });
}
function requestAddBot(tableId) {
  if (Store.botConfigured === true) {
    addBot(tableId);
    return;
  }
  if (Store.botConfigurable) {
    Store.set({ aiSettingsOpen: true, aiSettingsTableId: tableId, error: null });
    return;
  }
  addBot(tableId);
}
function openAiSettings(tableId = null) {
  Store.set({ aiSettingsOpen: true, aiSettingsTableId: tableId, error: null });
}
function closeAiSettings() {
  Store.set({ aiSettingsOpen: false, aiSettingsTableId: null, botConfigurationRequestId: null });
}
function configureBotApi(apiKey) {
  const requestId = rid();
  return send({ type: "configureBotApi", requestId, apiKey }) ? requestId : null;
}
function deleteTable(tableId) {
  send({ type: "deleteTable", requestId: rid(), tableId });
}
function watchTable(tableId) {
  Store.set({ spectateTableId: tableId, error: null });
  send({ type: "requestSnapshot", requestId: rid(), tableId });
}
function stopWatching() {
  Store.set({ spectateTableId: null, table: null });
  send({ type: "joinLobby", requestId: rid() });
}
function playAction(type, amount) {
  const t = Store.table;
  const s = Store.session;
  if (t === null || s === null) return;
  send({
    type: "action",
    commandId: "c" + (++seq).toString(36) + Date.now().toString(36),
    playerId: s.playerId,
    tableId: t.tableId,
    expectedVersion: t.version,
    action: type,
    amount
  });
}

// src/client/components/PokerHeader.tsx
var React3 = __toESM(require("react"), 1);

// src/client/agent-status.ts
var idleSessions = (selector) => selector({ byId: {} });
function useAgentRunning(props) {
  const useSessions = props.useSessions ?? idleSessions;
  return useSessions((state) => state.current !== void 0 && state.byId[state.current]?.running === true);
}

// src/client/components/AgentStatusBadge.tsx
var React2 = __toESM(require("react"), 1);
function AgentStatusBadge(props) {
  const state = props.running ? "thinking" : "idle";
  const label = tx(props.locale, props.running ? "agentThinking" : "agentIdle");
  return React2.createElement(
    "span",
    {
      className: `hp-agent-state ${state}${props.compact === true ? " compact" : ""}`,
      "data-agent-state": state,
      title: label
    },
    React2.createElement("i", { "aria-hidden": true }),
    props.compact === true ? null : label
  );
}

// src/client/components/PokerHeader.tsx
function PokerHeader(props) {
  const store = useStore();
  const locale = store.locale;
  const agentRunning = useAgentRunning(props);
  const t = store.table;
  const inTable = t !== null && store.session !== null && t.tableId === store.session.tableId;
  const watching = t !== null && !inTable && t.tableId === store.spectateTableId;
  const showMeta = inTable || watching;
  return React3.createElement(
    "div",
    { className: "hp-roombar" },
    React3.createElement(
      "div",
      { className: "hp-brand" },
      React3.createElement("span", { className: "hp-spade" }, "\u2660"),
      React3.createElement("span", null, tx(locale, "gameCenter")),
      React3.createElement("span", { className: "hp-crumb" }, `/ ${tx(locale, "poker")}`)
    ),
    showMeta && t !== null ? React3.createElement(
      "span",
      { className: "hp-table-meta" },
      React3.createElement("span", { className: "hp-tname" }, t.name),
      React3.createElement("span", { className: "hp-roomid" }, t.tableId),
      React3.createElement("button", {
        className: "hp-btn",
        title: tx(locale, "copyRoomTitle"),
        onClick: () => {
          const text = t.tableId;
          if (navigator.clipboard !== void 0 && navigator.clipboard.writeText !== void 0) {
            navigator.clipboard.writeText(text).catch(() => {
            });
          } else {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
              document.execCommand("copy");
            } catch (e) {
            }
            document.body.removeChild(ta);
          }
        }
      }, tx(locale, "copyRoom"))
    ) : null,
    React3.createElement("div", { className: "hp-spacer" }),
    React3.createElement(AgentStatusBadge, { running: agentRunning, locale }),
    store.botConfigurable ? React3.createElement(
      "button",
      {
        className: `hp-btn hp-ai-config${store.botConfigured === true ? " configured" : ""}`,
        "data-testid": "open-ai-settings",
        onClick: () => openAiSettings()
      },
      tx(locale, store.botConfigured === true ? "aiConfigured" : "aiSettings")
    ) : null,
    !store.connected ? React3.createElement("span", { className: "hp-conn" }, React3.createElement("div", { className: "hp-dotpulse" }), tx(locale, "reconnecting")) : null,
    React3.createElement(
      "button",
      {
        "data-testid": "language-toggle",
        className: "hp-btn hp-language-toggle",
        title: locale === "zh" ? "Switch to English" : "\u5207\u6362\u4E3A\u4E2D\u6587",
        onClick: () => setLocale(locale === "zh" ? "en" : "zh")
      },
      locale === "zh" ? "English" : "\u4E2D\u6587"
    ),
    inTable ? React3.createElement("button", { className: "hp-btn danger", onClick: leaveTable }, tx(locale, "leaveTable")) : null,
    watching ? React3.createElement("button", { className: "hp-btn", onClick: stopWatching }, tx(locale, "backLobby")) : null,
    React3.createElement("button", { className: "hp-btn", onClick: () => Store.set({ open: false }) }, tx(locale, "close"))
  );
}

// src/client/components/TableView.tsx
var React13 = __toESM(require("react"), 1);

// src/client/components/PokerStage.tsx
var React9 = __toESM(require("react"), 1);

// src/client/layout.ts
var SEAT_W = 172;
var SEAT_H = 130;
var SEAT_W_COMPACT = 150;
var SEAT_H_COMPACT = 118;
var STAGE_MARGIN = 14;
var STATUS_BAND = 30;
var NOMINAL_STAGE = { w: 1100, h: 620 };
var NOMINAL_STAGE_COMPACT = { w: 390, h: 700 };
var DESKTOP = {
  2: [
    [0.5, 0.06],
    [0.5, 1]
  ],
  3: [
    [0.25, 0.06],
    [0.75, 0.06],
    [0.5, 1]
  ],
  4: [
    [0.5, 0.06],
    [0.1, 0.52],
    [0.9, 0.52],
    [0.5, 1]
  ],
  5: [
    [0.25, 0.06],
    [0.75, 0.06],
    [0.08, 0.52],
    [0.92, 0.52],
    [0.5, 1]
  ],
  6: [
    [0.16, 0.05],
    [0.5, 0.03],
    [0.84, 0.05],
    [0.08, 0.52],
    [0.92, 0.52],
    [0.5, 1]
  ],
  7: [
    [0.18, 0.04],
    [0.5, 0.02],
    [0.82, 0.04],
    [0, 0.5],
    [1, 0.5],
    [0.18, 1],
    [0.5, 1]
  ],
  8: [
    [0, 0.02],
    [0.333, 0.02],
    [0.667, 0.02],
    [1, 0.02],
    [0, 0.5],
    [1, 0.5],
    [0.2, 1],
    [0.55, 1]
  ],
  9: [
    [0, 0],
    [0.333, 0],
    [0.667, 0],
    [1, 0],
    [0, 0.38],
    [1, 0.38],
    [0, 0.76],
    [1, 0.76],
    [0.5, 1]
  ],
  10: [
    [0, 0],
    [0.333, 0],
    [0.667, 0],
    [1, 0],
    [0, 0.38],
    [1, 0.38],
    [0, 0.76],
    [1, 0.76],
    [0.33, 1],
    [0.67, 1]
  ]
};
var COMPACT = {
  2: [
    [0.5, 0.06],
    [0.5, 1]
  ],
  3: [
    [0.3, 0.06],
    [0.7, 0.06],
    [0.5, 1]
  ],
  4: [
    [0.25, 0.06],
    [0.75, 0.06],
    [0.5, 0.3],
    [0.5, 1]
  ],
  5: [
    [0.25, 0.06],
    [0.75, 0.06],
    [0.25, 0.32],
    [0.75, 0.32],
    [0.5, 1]
  ],
  6: [
    [0.2, 0.05],
    [0.5, 0.07],
    [0.8, 0.05],
    [0.25, 0.32],
    [0.75, 0.32],
    [0.5, 1]
  ],
  7: DESKTOP[7],
  8: DESKTOP[8],
  9: DESKTOP[9],
  10: DESKTOP[10]
};
var DESKTOP_6_NARROW = [
  [0.16, 0.05],
  [0.5, 0.03],
  [0.84, 0.05],
  [0.08, 0.5],
  [0.92, 0.5],
  [0.5, 1]
];
function templateFor(count, compact, safeW) {
  const n = Math.min(Math.max(count, 2), 10);
  if (!compact && n === 6 && safeW < 4 * SEAT_W + 3 * 16) {
    return DESKTOP_6_NARROW;
  }
  const table = compact ? COMPACT : DESKTOP;
  return table[n] ?? table[10];
}
function slotIndexOf(seats, viewerSeat) {
  const viewerIdx = seats.indexOf(viewerSeat ?? -1);
  const order = [];
  for (let i = 0; i < seats.length; i++) if (i !== viewerIdx) order.push(i);
  if (viewerIdx >= 0) order.push(viewerIdx);
  const out = new Array(seats.length);
  order.forEach((seatIdx, slotIdx) => {
    out[seatIdx] = slotIdx;
  });
  return out;
}
function compute(seats, viewerSeat, compact, stageW, stageH) {
  const cardW = compact ? SEAT_W_COMPACT : SEAT_W;
  const cardH = compact ? SEAT_H_COMPACT : SEAT_H;
  const m = STAGE_MARGIN;
  const status = compact ? 0 : STATUS_BAND;
  const safeW = Math.max(stageW - cardW - 2 * m, 1);
  const safeH = Math.max(stageH - status - cardH - 2 * m, 1);
  const template = templateFor(seats.length, compact, safeW);
  const slotIdx = slotIndexOf(seats, viewerSeat);
  return seats.map((_, i) => {
    const [rx, ry] = template[slotIdx[i]] ?? template[0];
    return {
      left: m + cardW / 2 + rx * safeW,
      top: status + m + cardH / 2 + ry * safeH
    };
  });
}
function seatPositions(seats, viewerSeat, compact) {
  const stage = compact ? NOMINAL_STAGE_COMPACT : NOMINAL_STAGE;
  const out = compute(seats, viewerSeat, compact, stage.w, stage.h);
  return out.map((p) => ({ left: p.left / stage.w * 100, top: p.top / stage.h * 100 }));
}
function seatPositionsPx(seats, viewerSeat, compact, stageW, stageH) {
  return compute(seats, viewerSeat, compact, stageW, stageH);
}
function seatBoxes(centers, cardW, cardH) {
  return centers.map((c) => ({
    left: c.left - cardW / 2,
    top: c.top - cardH / 2,
    right: c.left + cardW / 2,
    bottom: c.top + cardH / 2
  }));
}

// src/client/components/PlayerSeat.tsx
var React5 = __toESM(require("react"), 1);

// src/client/components/ui.tsx
var React4 = __toESM(require("react"), 1);
function CardView(props) {
  const { card } = props;
  let cls = "hp-card";
  if (props.mini) cls += " mini";
  else if (props.small) cls += " small";
  const style = props.delay !== void 0 ? { animationDelay: `${props.delay}ms` } : void 0;
  if (card === null || card === void 0) return React4.createElement("div", { className: cls + " back" });
  cls += suitRed(card.suit) ? " red" : "";
  return React4.createElement(
    "div",
    { className: cls, style },
    React4.createElement("span", { className: "r" }, cardLabel(card.rank)),
    React4.createElement("span", { className: "s" }, suitChar(card.suit))
  );
}
function Badges(props) {
  const els = [];
  if (props.isDealer) els.push(React4.createElement("div", { key: "d", className: "hp-dbtn" }, "D"));
  if (props.isSmallBlind) els.push(React4.createElement("div", { key: "sb", className: "hp-blind" }, "SB"));
  if (props.isBigBlind) els.push(React4.createElement("div", { key: "bb", className: "hp-blind" }, "BB"));
  return React4.createElement(React4.Fragment, null, els);
}
function Spinner(props) {
  return React4.createElement(
    "div",
    { className: "hp-loading" },
    React4.createElement("div", { className: "hp-spinner" }),
    React4.createElement("div", null, props.label)
  );
}

// src/client/characters.ts
var CHARACTERS = [
  { id: "shark", glyph: "\u{1F988}", en: "Shark \xB7 pressure player", zh: "\u9CA8\u9C7C \xB7 \u65BD\u538B\u578B", thoughtsEn: ["Watching the current", "Smells weakness", "Pressure applied", "Clean bite"], thoughtsZh: ["\u89C2\u5BDF\u6C34\u6D41", "\u55C5\u5230\u4E86\u8F6F\u5F31", "\u5F00\u59CB\u65BD\u538B", "\u6F02\u4EAE\u7684\u4E00\u53E3"] },
  { id: "oracle", glyph: "\u{1F989}", en: "Oracle \xB7 patient reader", zh: "\u5148\u77E5 \xB7 \u8010\u5FC3\u8BFB\u724C", thoughtsEn: ["Reading the room", "Reading the river", "The pattern fits", "As foreseen"], thoughtsZh: ["\u89C2\u5BDF\u724C\u684C", "\u5728\u8BFB\u6CB3\u724C", "\u724C\u8DEF\u543B\u5408", "\u6B63\u5982\u6240\u6599"] },
  { id: "mochi", glyph: "\u{1F43C}", en: "Mochi \xB7 loose caller", zh: "\u9EBB\u85AF \xB7 \u5BBD\u677E\u8DDF\u6CE8", thoughtsEn: ["Keeping it light", "Cooking chaos", "Into the middle", "Sweet result"], thoughtsZh: ["\u8F7B\u677E\u89C2\u5BDF", "\u6B63\u5728\u5236\u9020\u6DF7\u4E71", "\u9001\u8FDB\u6C60\u91CC", "\u7ED3\u679C\u5F88\u751C"] },
  { id: "glitch", glyph: "\u{1F47E}", en: "Glitch \xB7 volatile attacker", zh: "\u6545\u969C \xB7 \u6FC0\u8FDB\u53D8\u901F", thoughtsEn: ["Sampling signals", "Rewriting the odds", "Executing branch", "Outcome accepted"], thoughtsZh: ["\u91C7\u6837\u4FE1\u53F7", "\u6B63\u5728\u6539\u5199\u8D54\u7387", "\u6267\u884C\u5206\u652F", "\u63A5\u53D7\u7ED3\u679C"] },
  { id: "ghost", glyph: "\u{1F47B}", en: "Ghost \xB7 trap setter", zh: "\u5E7D\u7075 \xB7 \u8BBE\u9677\u578B", thoughtsEn: ["Barely visible", "Setting a trap", "The trap closes", "Quietly collected"], thoughtsZh: ["\u85CF\u5728\u6697\u5904", "\u6B63\u5728\u5E03\u7F6E\u9677\u9631", "\u9677\u9631\u6536\u7D27", "\u5B89\u9759\u6536\u6C60"] }
];
function characterForSeat(seat, locale) {
  const profile = CHARACTERS[((seat - 1) % CHARACTERS.length + CHARACTERS.length) % CHARACTERS.length];
  return {
    id: profile.id,
    glyph: profile.glyph,
    title: locale === "zh" ? profile.zh : profile.en,
    thought: locale === "zh" ? profile.thoughtsZh[1] : profile.thoughtsEn[1]
  };
}
function characterStateForSeat(seat, phase, isWinner) {
  if (isWinner) return "reacting";
  if (phase === "idle" || seat.folded || seat.excluded || !seat.connected) return "idle";
  if (seat.isTurn) return "thinking";
  if (seat.bet > 0 && (seat.lastAction?.type === "bet" || seat.lastAction?.type === "raise" || seat.lastAction?.type === "allin")) return "acting";
  return "observing";
}
function characterThought(seat, state, locale) {
  const profile = CHARACTERS[((seat - 1) % CHARACTERS.length + CHARACTERS.length) % CHARACTERS.length];
  if (state === "idle") return "";
  const index = state === "observing" ? 0 : state === "thinking" ? 1 : state === "acting" ? 2 : 3;
  return locale === "zh" ? profile.thoughtsZh[index] : profile.thoughtsEn[index];
}

// src/client/components/PlayerSeat.tsx
function PlayerSeat(props) {
  const { seat } = props;
  const locale = useStore().locale;
  if (seat === void 0 || seat.playerId === "") return null;
  const character = seat.isBot ? characterForSeat(seat.seat, locale) : null;
  const characterState = character === null ? null : characterStateForSeat(seat, props.phase, props.isWinner);
  const thought = characterState === null ? "" : characterThought(seat.seat, characterState, locale);
  let cards = null;
  if (seat.holeCards !== void 0 && seat.holeCards.length > 0) {
    cards = React5.createElement(
      "div",
      { className: "hp-cards" },
      seat.holeCards.map((c, i) => React5.createElement(CardView, { key: `h${props.handNumber}-${i}`, card: c, small: true, delay: 90 + i * 90 }))
    );
  } else if (!seat.folded && !seat.excluded) {
    cards = React5.createElement(
      "div",
      { className: "hp-cards" },
      React5.createElement(CardView, { key: `b${props.handNumber}-0`, card: null, small: true }),
      React5.createElement(CardView, { key: `b${props.handNumber}-1`, card: null, small: true })
    );
  }
  let stateText = null;
  if (seat.folded) stateText = React5.createElement("div", { className: "hp-sstate" }, tx(locale, "folded"));
  else if (seat.excluded) stateText = React5.createElement("div", { className: "hp-sstate" }, tx(locale, "nextHand"));
  else if (seat.allIn) stateText = React5.createElement("div", { className: "hp-sstate allin" }, tx(locale, "allIn"));
  const countdown = seat.isTurn && props.deadlineMs > 0 && props.secondsLeft !== null ? React5.createElement("div", { className: "hp-count" }, tx(locale, "seconds", { n: props.secondsLeft })) : null;
  let cls = "hp-seat";
  if (seat.isMe) cls += " me";
  if (seat.isTurn) cls += " turn";
  if (seat.folded) cls += " folded";
  if (props.isWinner) cls += " winner";
  if (characterState !== null) cls += ` character-${characterState}`;
  if (props.className) cls += " " + props.className;
  return React5.createElement(
    "div",
    {
      className: cls,
      style: props.style,
      ...characterState === null ? {} : { "data-character-state": characterState }
    },
    React5.createElement(
      "div",
      { className: "hp-seat-head" },
      React5.createElement(
        "div",
        {
          className: "hp-avatar",
          ...character === null ? {} : { "data-character": character.id, title: character.title }
        },
        character?.glyph ?? displayNickname(seat.nickname || "?", seat.isBot, locale).slice(0, 1).toUpperCase(),
        React5.createElement(Badges, { isDealer: seat.isDealer, isSmallBlind: seat.isSmallBlind, isBigBlind: seat.isBigBlind }),
        React5.createElement("div", { className: "hp-dot" + (seat.connected ? "" : " off") })
      ),
      React5.createElement("div", { className: "hp-sname" }, displayNickname(seat.nickname, seat.isBot, locale) + (seat.isMe ? locale === "zh" ? `\uFF08${tx(locale, "you")}\uFF09` : ` (${tx(locale, "you")})` : "")),
      seat.isBot ? React5.createElement("span", { className: "hp-ai-badge" }, tx(locale, "bot")) : null,
      countdown
    ),
    React5.createElement(
      "div",
      { className: "hp-srow" },
      React5.createElement("div", { className: "hp-sstack" }, fmt(seat.stack)),
      seat.bet > 0 ? React5.createElement("div", { key: `bet-${seat.playerId.slice(0, 6)}-${seat.bet}`, className: "hp-sbet" }, `${tx(locale, "bet")} ${fmt(seat.bet)}`) : null
    ),
    stateText,
    seat.lastAction !== null && seat.lastAction !== void 0 ? React5.createElement(
      "div",
      { className: "hp-last-action", "data-action": seat.lastAction.type },
      `${tx(locale, seat.lastAction.type === "allin" ? "allIn" : seat.lastAction.type)}${seat.lastAction.amount > 0 ? ` ${fmt(seat.lastAction.amount)}` : ""}`
    ) : null,
    cards,
    character !== null && characterState !== null && (characterState === "thinking" || characterState === "reacting") ? React5.createElement("div", { className: "hp-thought", "data-character": character.id }, thought) : null,
    props.isWinner && props.winAmount > 0 ? React5.createElement("div", { className: "hp-win-payout", "aria-label": `+${fmt(props.winAmount)}` }, `+${fmt(props.winAmount)}`) : null
  );
}

// src/client/components/PokerTable.tsx
var React6 = __toESM(require("react"), 1);
function CommunityCards(props) {
  if (props.community.length === 0) return React6.createElement(React6.Fragment, null);
  return React6.createElement(
    "div",
    { className: "hp-community" },
    props.community.map((c, i) => React6.createElement(CardView, { key: `c${props.handNumber}-${i}`, card: c, delay: i * 70 }))
  );
}
function PotDisplay(props) {
  const locale = useStore().locale;
  const total = props.pots.reduce((s, p) => s + p.amount, 0);
  if (total === 0 && props.pots.length === 0) return null;
  let label = `${tx(locale, "pot")} ${fmt(total)}`;
  if (props.pots.length > 1) label += `  (${props.pots.map((p) => fmt(p.amount)).join(" + ")})`;
  return React6.createElement("div", { key: `pot-${total}`, className: "hp-pot" }, label);
}
function WaitingState(props) {
  const locale = useStore().locale;
  return React6.createElement(
    "div",
    { className: "hp-waiting" },
    React6.createElement("div", { className: "hp-bigspade" }, "\u2660"),
    React6.createElement("div", { className: "hp-wtitle" }, tx(locale, "waitingPlayers")),
    React6.createElement("div", { className: "hp-hint" }, tx(locale, "inviteHint", { seated: props.seated, max: props.maxSeats }))
  );
}

// src/client/components/useCompact.ts
var React7 = __toESM(require("react"), 1);
function useCompact() {
  const [compact, setCompact] = React7.useState(false);
  React7.useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia === void 0) return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(mq.matches);
    update();
    if (mq.addEventListener !== void 0) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    return void 0;
  }, []);
  return compact;
}

// src/client/components/TableBets.tsx
var React8 = __toESM(require("react"), 1);
function TableBets(props) {
  if (props.compact) return null;
  const centre = { left: props.stageWidth / 2, top: props.stageHeight * 0.56 };
  return React8.createElement(
    React8.Fragment,
    null,
    props.seats.filter((seat) => seat.bet > 0).map((seat) => {
      const origin = props.positions.get(seat.seat);
      if (origin === void 0) return null;
      const left = origin.left + (centre.left - origin.left) * 0.34;
      const top = origin.top + (centre.top - origin.top) * 0.34;
      const style = {
        left,
        top,
        "--hp-chip-from-x": `${origin.left - left}px`,
        "--hp-chip-from-y": `${origin.top - top}px`
      };
      return React8.createElement(
        "div",
        {
          key: `${props.handNumber}-${seat.playerId}-${seat.bet}`,
          className: "hp-table-bet",
          style,
          "data-chip-player": seat.playerId
        },
        React8.createElement("i", { "aria-hidden": true }),
        React8.createElement("span", null, fmt(seat.bet))
      );
    })
  );
}

// src/client/components/PokerStage.tsx
function useElementSize() {
  const ref = React9.useRef(null);
  const [size, setSize] = React9.useState({ width: NOMINAL_STAGE.w, height: NOMINAL_STAGE.h });
  React9.useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r !== void 0 && r.width > 0 && r.height > 0) setSize({ width: r.width, height: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}
function PokerStage(props) {
  const t = props.table;
  const locale = useStore().locale;
  const compact = useCompact();
  const [stageRef, size] = useElementSize();
  const occupied = t.seats.filter((s) => s.playerId !== "");
  const viewerSeat = t.mySeat;
  const secondsLeft = t.actionDeadlineAt > 0 ? Math.max(0, Math.ceil((t.actionDeadlineAt - Date.now()) / 1e3)) : null;
  const winnerIds = new Set(t.winners.map((w) => w.playerId));
  const winAmounts = new Map(t.winners.map((winner) => [winner.playerId, winner.amount]));
  const positions = seatPositionsPx(occupied.map((s) => s.seat), viewerSeat, false, size.width, size.height);
  const bySeat = /* @__PURE__ */ new Map();
  occupied.forEach((s, i) => {
    const p = positions[i];
    if (p !== void 0) bySeat.set(s.seat, p);
  });
  const renderSeat = (s) => {
    const pos = bySeat.get(s.seat);
    return React9.createElement(PlayerSeat, {
      key: s.playerId,
      seat: s,
      handNumber: t.handNumber,
      secondsLeft,
      deadlineMs: t.actionDeadlineAt,
      isWinner: winnerIds.has(s.playerId),
      winAmount: winAmounts.get(s.playerId) ?? 0,
      phase: t.phase,
      style: pos !== void 0 && !compact ? { left: pos.left, top: pos.top } : void 0,
      className: compact ? s.isMe ? void 0 : "flow" : void 0
    });
  };
  const felt = React9.createElement(
    "div",
    { className: "hp-felt" },
    t.phase === "idle" ? React9.createElement(WaitingState, { seated: occupied.length, maxSeats: t.maxSeats }) : React9.createElement(CommunityCards, { community: t.community, handNumber: t.handNumber }),
    React9.createElement(PotDisplay, { pots: t.pots })
  );
  const opponents = occupied.filter((s) => !s.isMe);
  let body;
  if (compact) {
    body = React9.createElement(
      React9.Fragment,
      null,
      React9.createElement("div", { className: "hp-seats-row" }, opponents.map(renderSeat)),
      felt,
      occupied.filter((s) => s.isMe).map(renderSeat)
    );
  } else {
    body = React9.createElement(
      React9.Fragment,
      null,
      felt,
      React9.createElement(TableBets, {
        seats: occupied,
        positions: bySeat,
        stageWidth: size.width,
        stageHeight: size.height,
        handNumber: t.handNumber,
        compact
      }),
      occupied.map(renderSeat)
    );
  }
  const phaseLabel = {
    idle: tx(locale, "phaseIdle"),
    preflop: tx(locale, "phasePreflop"),
    flop: tx(locale, "phaseFlop"),
    turn: tx(locale, "phaseTurn"),
    river: tx(locale, "phaseRiver"),
    showdown: tx(locale, "phaseShowdown")
  }[t.phase] ?? t.phase;
  return React9.createElement(
    "div",
    {
      className: `hp-stage${t.currentTurnSeat >= 0 ? " has-action" : ""}`,
      ref: stageRef,
      "data-focus-seat": t.currentTurnSeat >= 0 ? t.currentTurnSeat : void 0
    },
    React9.createElement(
      "div",
      { className: "hp-statusline" },
      React9.createElement("span", { className: "hp-phase" }, phaseLabel),
      React9.createElement("span", { className: "hp-hand" }, tx(locale, "hand", { n: t.handNumber })),
      React9.createElement("span", null, `${t.name}`)
    ),
    body
  );
}

// src/client/components/ActionDock.tsx
var React11 = __toESM(require("react"), 1);

// src/client/raise-sizing.ts
function normalizeRaiseTo(value, bounds) {
  if (!Number.isFinite(value)) return bounds.min;
  const bounded = Math.max(bounds.min, Math.min(bounds.max, Math.round(value)));
  const step = Math.max(1, Math.round(bounds.step));
  const snapped = bounds.min + Math.round((bounded - bounds.min) / step) * step;
  return Math.max(bounds.min, Math.min(bounds.max, snapped));
}
function presetRaiseTo(preset, bounds) {
  if (preset === "min") return bounds.min;
  if (preset === "max") return bounds.max;
  const fraction = preset === "half-pot" ? 0.5 : preset === "three-quarter-pot" ? 0.75 : 1;
  const potAfterCall = bounds.pot + bounds.callAmount;
  const raw = bounds.raising ? bounds.currentBet + potAfterCall * fraction : Math.max(bounds.step, bounds.pot) * fraction;
  return normalizeRaiseTo(raw, bounds);
}

// src/client/components/RaiseSizer.tsx
var React10 = __toESM(require("react"), 1);
var PRESETS = ["min", "half-pot", "three-quarter-pot", "pot", "max"];
function RaiseSizer(props) {
  const [draft, setDraft] = React10.useState(String(props.value));
  React10.useEffect(() => setDraft(String(props.value)), [props.value]);
  const label = (preset) => {
    if (preset === "min") return tx(props.locale, "minimum");
    if (preset === "half-pot") return "\xBD";
    if (preset === "three-quarter-pot") return "\xBE";
    if (preset === "pot") return tx(props.locale, "potPreset");
    return tx(props.locale, "maximum");
  };
  const select = (value) => props.onChange(normalizeRaiseTo(value, props.bounds));
  const commitDraft = () => {
    const parsed = Number(draft.replace(/,/g, "").trim());
    if (Number.isFinite(parsed)) select(parsed);
    else setDraft(String(props.value));
  };
  return React10.createElement(
    "div",
    { className: "hp-bet-presets", "aria-label": tx(props.locale, "raiseSizing") },
    React10.createElement(
      "div",
      { className: "hp-raise-quick" },
      PRESETS.map((preset) => {
        const amount = presetRaiseTo(preset, props.bounds);
        return React10.createElement(
          "button",
          {
            key: preset,
            type: "button",
            className: `hp-preset${props.value === amount ? " selected" : ""}`,
            disabled: props.disabled,
            "data-raise-preset": preset,
            title: fmt(amount),
            onClick: () => select(amount)
          },
          label(preset)
        );
      })
    ),
    React10.createElement("input", {
      className: "hp-preset-track",
      type: "range",
      min: props.bounds.min,
      max: props.bounds.max,
      step: Math.max(1, props.bounds.step),
      value: props.value,
      disabled: props.disabled,
      "data-testid": "raise-slider",
      "aria-label": tx(props.locale, "raiseAmount"),
      onChange: (event) => select(Number(event.currentTarget.value))
    }),
    React10.createElement(
      "label",
      { className: "hp-raise-input" },
      React10.createElement("span", null, tx(props.locale, "raiseTo")),
      React10.createElement("input", {
        type: "text",
        inputMode: "numeric",
        value: draft,
        disabled: props.disabled,
        "data-testid": "raise-input",
        "aria-label": tx(props.locale, "raiseAmount"),
        onChange: (event) => setDraft(event.currentTarget.value),
        onBlur: commitDraft,
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitDraft();
            event.currentTarget.blur();
          }
        }
      }),
      React10.createElement("strong", null, fmt(props.value))
    ),
    props.canAllIn ? React10.createElement("button", { type: "button", className: "hp-preset allin", disabled: props.disabled, onClick: props.onAllIn }, tx(props.locale, "allIn")) : null
  );
}

// src/client/components/ActionDock.tsx
function ActionDock(props) {
  const t = props.table;
  const locale = useStore().locale;
  const mySeat = t.mySeat;
  const myTurn = mySeat !== null && mySeat === t.currentTurnSeat && props.connected;
  const [raiseTo, setRaiseTo] = React11.useState(0);
  const actions = props.spectating ? [] : t.myLegalActions ?? [];
  const callAction = actions.find((a) => a.type === "call");
  const betAction = actions.find((a) => a.type === "bet");
  const raiseAction = actions.find((a) => a.type === "raise");
  const checkAction = actions.find((a) => a.type === "check");
  const canFold = actions.some((a) => a.type === "fold");
  const canAllIn = actions.some((a) => a.type === "allin");
  const callLabel = callAction !== void 0 && callAction.amount !== void 0 ? `${tx(locale, "call")} ${fmt(callAction.amount)}` : checkAction !== void 0 ? tx(locale, "check") : null;
  const betLabel = betAction !== void 0 ? tx(locale, "bet") : raiseAction !== void 0 ? tx(locale, "raise") : null;
  const raiseBase = betAction !== void 0 ? betAction : raiseAction;
  const potTotal = t.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const occupiedSeats = t.seats.filter((seat) => seat.playerId !== "").length;
  const full = occupiedSeats >= t.maxSeats;
  const raiseBounds = raiseBase === void 0 ? null : {
    min: raiseBase.min ?? 1,
    max: raiseBase.max ?? raiseBase.min ?? 1,
    pot: potTotal,
    currentBet: t.toCall,
    callAmount: callAction?.amount ?? 0,
    step: 1,
    raising: raiseAction !== void 0
  };
  const selectedAmount = raiseBounds === null ? 0 : normalizeRaiseTo(raiseTo > 0 ? raiseTo : presetRaiseTo("pot", raiseBounds), raiseBounds);
  React11.useEffect(() => {
    if (raiseBounds !== null) setRaiseTo(presetRaiseTo("pot", raiseBounds));
  }, [t.handNumber, t.phase, t.currentTurnSeat, t.toCall, raiseBase?.min, raiseBase?.max, potTotal]);
  const current = t.seats.find((s) => s.seat === t.currentTurnSeat);
  let hint;
  if (!props.connected) hint = tx(locale, "disconnectedHint");
  else if (props.spectating) hint = tx(locale, "spectatingHint");
  else if (t.phase === "idle") hint = tx(locale, "waitingOthers");
  else if (!myTurn) hint = tx(locale, "waitingPlayerAction", { name: current !== void 0 ? displayNickname(current.nickname, current.isBot, locale) : tx(locale, "otherPlayer") });
  else hint = tx(locale, "yourTurn");
  if (props.spectating) {
    return React11.createElement(
      "div",
      { className: "hp-dock" },
      React11.createElement(
        "div",
        { className: "hp-actionrow" },
        React11.createElement("button", { className: "hp-action-btn call", disabled: !props.connected, onClick: () => joinTable(t.tableId, props.nickname || (locale === "zh" ? "\u73A9\u5BB6" : "Player"), t.buyIn) }, tx(locale, "joinTable")),
        React11.createElement("button", { className: "hp-btn ghost", onClick: stopWatching }, tx(locale, "backLobby"))
      ),
      React11.createElement("div", { className: "hp-hint" }, hint)
    );
  }
  if (t.phase === "idle") {
    return React11.createElement(
      "div",
      { className: "hp-dock" },
      React11.createElement(
        "div",
        { className: "hp-actionrow" },
        React11.createElement(
          "button",
          {
            "data-testid": "add-bot",
            className: "hp-action-btn bot primary-action",
            disabled: !props.connected || full,
            onClick: () => requestAddBot(t.tableId)
          },
          full ? tx(locale, "tableFull") : tx(locale, "addBot")
        )
      ),
      React11.createElement("div", { className: "hp-hint" }, full ? tx(locale, "waitingStart") : tx(locale, "addBotHint"))
    );
  }
  return React11.createElement(
    "div",
    { className: `hp-dock${myTurn ? " is-my-turn" : " is-waiting"}${raiseBounds !== null ? " has-raise" : ""}` },
    raiseBounds !== null ? React11.createElement(RaiseSizer, {
      bounds: raiseBounds,
      value: selectedAmount,
      disabled: !myTurn,
      canAllIn,
      locale,
      onChange: setRaiseTo,
      onAllIn: () => playAction("allin")
    }) : null,
    React11.createElement(
      "div",
      { className: "hp-actionrow" },
      React11.createElement("button", { className: "hp-action-btn fold", disabled: !myTurn || !canFold, onClick: () => playAction("fold") }, tx(locale, "fold")),
      callLabel !== null ? React11.createElement("button", { className: "hp-action-btn call", disabled: !myTurn, onClick: () => playAction(callAction !== void 0 ? "call" : "check") }, callLabel) : null,
      betLabel !== null ? React11.createElement(
        "button",
        {
          "data-testid": "primary-bet",
          className: "hp-action-btn bet primary-action",
          disabled: !myTurn,
          onClick: () => raiseBase !== void 0 && playAction(raiseBase.type, selectedAmount)
        },
        `${betLabel} ${fmt(selectedAmount)}`
      ) : React11.createElement("button", { className: "hp-action-btn allin primary-action", disabled: !myTurn || !canAllIn, onClick: () => playAction("allin") }, tx(locale, "allIn"))
    ),
    React11.createElement(
      "div",
      { className: "hp-hint hp-hint-actions" },
      React11.createElement("span", null, hint),
      React11.createElement(
        "button",
        {
          "data-testid": "add-bot-active",
          className: "hp-add-bot-inline",
          disabled: !props.connected || full,
          onClick: () => requestAddBot(t.tableId),
          title: full ? tx(locale, "tableFull") : tx(locale, "botNextHand")
        },
        full ? tx(locale, "seatsFull", { occupied: occupiedSeats, max: t.maxSeats }) : tx(locale, "addBotCompact", { occupied: occupiedSeats, max: t.maxSeats })
      )
    )
  );
}

// src/client/components/HandHistoryDrawer.tsx
var React12 = __toESM(require("react"), 1);
function HandHistoryDrawer(props) {
  const locale = useStore().locale;
  const ref = React12.useRef(null);
  React12.useEffect(() => {
    if (props.open && ref.current !== null) ref.current.scrollTop = ref.current.scrollHeight;
  }, [props.open, props.log.length]);
  if (!props.open) return null;
  return React12.createElement(
    "div",
    { className: "hp-drawer" },
    React12.createElement(
      "div",
      { className: "hp-drawer-head" },
      React12.createElement("span", null, tx(locale, "handHistory")),
      React12.createElement("span", { className: "hp-spacer" }),
      React12.createElement("button", { className: "hp-btn ghost", onClick: props.onClose }, tx(locale, "close"))
    ),
    React12.createElement(
      "div",
      { className: "hp-log", ref },
      props.log.map((entry, i) => {
        const cls = /wins|Showdown/i.test(entry.text) ? "good" : /folds|left|timeout/i.test(entry.text) ? "warn" : "";
        return React12.createElement(
          "div",
          { key: i, className: cls },
          React12.createElement("span", { className: "t" }, timeStr(entry.at)),
          translateLog(entry.text, locale)
        );
      })
    )
  );
}

// src/client/components/TableView.tsx
function TableView() {
  const store = useStore();
  const locale = store.locale;
  const t = store.table;
  const [drawerOpen, setDrawerOpen] = React13.useState(false);
  if (t === null) return null;
  const spectating = t.mySeat === null;
  const showdown = t.winners.length > 0 ? React13.createElement(
    "div",
    { className: "hp-showdown" },
    React13.createElement("span", { className: "w" }, tx(locale, "hand", { n: t.handNumber })),
    " \u2014 ",
    t.winners.map(
      (w, i) => React13.createElement(
        "span",
        { key: i },
        i > 0 ? ", " : null,
        React13.createElement("span", { className: "w" }, `${displayNickname(w.nickname, /^AI Player(?: \d+)?$/.test(w.nickname), locale)} ${tx(locale, "wins")} ${fmt(w.amount)}`),
        ` (${translateHandLabel(w.handLabel, locale)})`
      )
    ),
    t.reveal.length > 0 ? React13.createElement(
      "div",
      { style: { marginTop: 4 } },
      `${tx(locale, "showdown")}${locale === "zh" ? "\uFF1A" : ": "}${t.reveal.map((r) => `${displayNickname(r.nickname, /^AI Player(?: \d+)?$/.test(r.nickname), locale)} [${r.cards.join(" ").toUpperCase()}] \u2014 ${translateHandLabel(r.handLabel, locale)}`).join(" \xB7 ")}`
    ) : null
  ) : null;
  return React13.createElement(
    React13.Fragment,
    null,
    !store.connected ? React13.createElement("div", { className: "hp-banner warn" }, React13.createElement("div", { className: "hp-dotpulse" }), tx(locale, "connectionLost")) : null,
    React13.createElement(PokerStage, { table: t }),
    showdown,
    React13.createElement(ActionDock, {
      table: t,
      spectating,
      connected: store.connected,
      nickname: store.nickname
    }),
    React13.createElement(
      "div",
      { className: "hp-history-control" },
      React13.createElement("button", { className: "hp-btn hp-drawer-toggle", onClick: () => setDrawerOpen((v) => !v) }, tx(locale, drawerOpen ? "collapseHistory" : "handHistory"))
    ),
    React13.createElement(HandHistoryDrawer, { open: drawerOpen, log: t.log, onClose: () => setDrawerOpen(false) })
  );
}

// src/client/components/LobbyView.tsx
var React14 = __toESM(require("react"), 1);
function LobbyView() {
  const store = useStore();
  const locale = store.locale;
  const [nickname, setNickname] = React14.useState(store.nickname || (store.session !== null ? store.session.nickname : ""));
  const [tableName, setTableName] = React14.useState("");
  const [maxSeats, setMaxSeats] = React14.useState("6");
  const [buyIn, setBuyIn] = React14.useState("1000");
  const [joinId, setJoinId] = React14.useState("");
  const [deleteTarget, setDeleteTarget] = React14.useState(null);
  const tables = store.lobby ?? [];
  const walletText = store.wallet === null ? "\u2026" : String(store.wallet).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (store.connecting) {
    return React14.createElement("div", { className: "hp-loading" }, React14.createElement("div", { className: "hp-spinner" }), React14.createElement("div", null, tx(locale, "connecting")));
  }
  const createPanel = React14.createElement(
    "div",
    { className: "hp-panel" },
    React14.createElement("h3", null, tx(locale, "createTable")),
    React14.createElement(
      "div",
      { className: "hp-field" },
      React14.createElement("label", null, tx(locale, "nickname")),
      React14.createElement("input", { "data-testid": "nickname", className: "hp-input", value: nickname, maxLength: 20, onChange: (e) => setNickname(e.target.value) })
    ),
    React14.createElement(
      "div",
      { className: "hp-row" },
      React14.createElement(
        "div",
        { className: "hp-field", style: { flex: 1 } },
        React14.createElement("label", null, tx(locale, "tableName")),
        React14.createElement("input", { "data-testid": "table-name", className: "hp-input", value: tableName, maxLength: 40, placeholder: tx(locale, "tableNamePlaceholder"), onChange: (e) => setTableName(e.target.value) })
      ),
      React14.createElement(
        "div",
        { className: "hp-field", style: { width: 88 } },
        React14.createElement("label", null, tx(locale, "seats")),
        React14.createElement(
          "select",
          { className: "hp-input", value: maxSeats, onChange: (e) => setMaxSeats(e.target.value) },
          ["2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => React14.createElement("option", { key: n, value: n }, n))
        )
      )
    ),
    React14.createElement(
      "button",
      {
        className: "hp-btn primary",
        disabled: !store.connected || nickname.trim() === "",
        onClick: () => {
          Store.set({ nickname: nickname.trim() });
          createTable(tableName.trim() || (locale === "zh" ? `\u6251\u514B ${maxSeats} \u4EBA\u684C` : `Poker ${maxSeats}-seat`), Number(maxSeats));
        }
      },
      tx(locale, "createTable")
    )
  );
  const listPanel = tables.length === 0 ? React14.createElement(
    "div",
    { className: "hp-panel" },
    React14.createElement("h3", null, tx(locale, "openTables")),
    React14.createElement(
      "div",
      { className: "hp-empty" },
      React14.createElement("div", { className: "hp-bigspade" }, "\u2660"),
      React14.createElement("div", null, tx(locale, "noTables")),
      React14.createElement("div", { className: "hp-hint" }, tx(locale, "noTablesHint"))
    )
  ) : React14.createElement(
    "div",
    { className: "hp-panel" },
    React14.createElement("h3", null, tx(locale, "openTables")),
    React14.createElement(
      "div",
      { className: "hp-tablelist" },
      tables.map((t) => {
        const full = t.playerCount >= t.maxSeats;
        return React14.createElement(
          "div",
          { key: t.tableId, className: "hp-table-item" },
          React14.createElement(
            "div",
            { className: "hp-tinfo" },
            React14.createElement("div", { className: "hp-tname" }, t.name),
            React14.createElement("div", { className: "hp-tmeta" }, `${t.playerCount}/${t.maxSeats} ${tx(locale, "players")} \xB7 ${tx(locale, "blinds")} ${t.smallBlind}/${t.bigBlind} \xB7 ${tx(locale, "buyIn")} ${t.buyIn}`),
            React14.createElement("div", { className: "hp-tmeta" }, `${tx(locale, "room")}${locale === "zh" ? "\uFF1A" : ": "}${t.tableId}`)
          ),
          React14.createElement(
            "div",
            { className: "hp-table-actions" },
            React14.createElement(
              "span",
              { className: `hp-badge ${t.status === "playing" ? "live" : "wait"}` },
              tx(locale, t.status === "playing" ? "playing" : t.status === "paused" ? "paused" : "waiting")
            ),
            deleteTarget === t.tableId ? React14.createElement(
              React14.Fragment,
              null,
              React14.createElement("button", { className: "hp-btn", onClick: () => setDeleteTarget(null) }, tx(locale, "cancelDelete")),
              React14.createElement(
                "button",
                {
                  className: "hp-btn danger",
                  "data-testid": `confirm-delete-${t.tableId}`,
                  title: tx(locale, "deleteRoomWarning"),
                  onClick: () => {
                    setDeleteTarget(null);
                    deleteTable(t.tableId);
                  }
                },
                tx(locale, "confirmDelete")
              )
            ) : React14.createElement(
              React14.Fragment,
              null,
              full ? React14.createElement("button", { className: "hp-btn", disabled: !store.connected, onClick: () => watchTable(t.tableId) }, tx(locale, "watch")) : React14.createElement(
                "button",
                {
                  "data-testid": `join-${t.tableId}`,
                  className: "hp-btn primary",
                  disabled: !store.connected || nickname.trim() === "",
                  onClick: () => {
                    Store.set({ nickname: nickname.trim() });
                    joinTable(t.tableId, nickname.trim() || (locale === "zh" ? "\u73A9\u5BB6" : "Player"), Number(buyIn) > 0 ? Number(buyIn) : t.buyIn);
                  }
                },
                tx(locale, "join")
              ),
              store.botConfigurable ? React14.createElement(
                "button",
                {
                  className: "hp-btn hp-delete-room",
                  "data-testid": `delete-${t.tableId}`,
                  title: tx(locale, "deleteRoomWarning"),
                  onClick: () => setDeleteTarget(t.tableId)
                },
                tx(locale, "deleteRoom")
              ) : null
            )
          )
        );
      })
    )
  );
  return React14.createElement(
    "div",
    { className: "hp-lobby" },
    React14.createElement(
      "div",
      { className: "hp-wallet" },
      `${tx(locale, "playTokens")}${locale === "zh" ? "\uFF1A" : ": "}`,
      React14.createElement("b", null, walletText),
      ` \xB7 ${tx(locale, "blinds")} 5/10 \xB7 ${tx(locale, "defaultBuyIn")} 1000`
    ),
    React14.createElement("div", { className: "hp-lobby-grid" }, createPanel, listPanel),
    React14.createElement(
      "div",
      { className: "hp-panel" },
      React14.createElement("h3", null, tx(locale, "joinByRoom")),
      React14.createElement(
        "div",
        { className: "hp-row" },
        React14.createElement("input", { "data-testid": "join-id", className: "hp-input", style: { flex: 1, minWidth: 140 }, value: joinId, placeholder: tx(locale, "pasteRoom"), onChange: (e) => setJoinId(e.target.value) }),
        React14.createElement(
          "button",
          {
            className: "hp-btn primary",
            disabled: !store.connected || joinId.trim() === "" || nickname.trim() === "",
            onClick: () => {
              const id = joinId.trim();
              const meta = tables.find((t) => t.tableId === id);
              Store.set({ nickname: nickname.trim() });
              joinTable(id, nickname.trim() || (locale === "zh" ? "\u73A9\u5BB6" : "Player"), meta !== void 0 ? meta.buyIn : 1e3);
            }
          },
          tx(locale, "join")
        )
      ),
      React14.createElement(
        "div",
        { className: "hp-field" },
        React14.createElement("label", null, tx(locale, "buyInChips")),
        React14.createElement("input", { className: "hp-input", type: "number", min: 1, value: buyIn, onChange: (e) => setBuyIn(e.target.value) })
      )
    ),
    React14.createElement("div", { className: "hp-err" }, store.error !== null ? translateError(store.error, locale) : " ")
  );
}

// src/client/components/AiSettingsDialog.tsx
var React15 = __toESM(require("react"), 1);
function AiSettingsDialog() {
  const store = useStore();
  const [apiKey, setApiKey] = React15.useState("");
  const [pendingRequest, setPendingRequest] = React15.useState(null);
  const [localError, setLocalError] = React15.useState("");
  const dismiss = React15.useCallback(() => {
    setApiKey("");
    setPendingRequest(null);
    setLocalError("");
    closeAiSettings();
  }, []);
  React15.useEffect(() => {
    if (pendingRequest === null || store.botConfigurationRequestId !== pendingRequest || store.botConfigured !== true) return;
    const tableId = store.aiSettingsTableId;
    setApiKey("");
    setPendingRequest(null);
    closeAiSettings();
    if (tableId !== null) addBot(tableId);
  }, [pendingRequest, store.botConfigurationRequestId, store.botConfigured, store.aiSettingsTableId]);
  React15.useEffect(() => {
    if (!store.aiSettingsOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && pendingRequest === null) dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, pendingRequest, store.aiSettingsOpen]);
  if (!store.aiSettingsOpen || !store.botConfigurable) return null;
  const valid = apiKey.trim().length >= 8;
  const submit = () => {
    if (!valid) {
      setLocalError(tx(store.locale, "aiKeyTooShort"));
      return;
    }
    const requestId = configureBotApi(apiKey.trim());
    if (requestId === null) {
      setLocalError(tx(store.locale, "aiKeySendFailed"));
      return;
    }
    setLocalError("");
    setPendingRequest(requestId);
  };
  return React15.createElement(
    "div",
    { className: "hp-ai-settings-backdrop", role: "presentation" },
    React15.createElement(
      "div",
      { className: "hp-ai-settings", role: "dialog", "aria-modal": true, "aria-labelledby": "hp-ai-settings-title" },
      React15.createElement("div", { className: "hp-ai-settings-icon", "aria-hidden": true }, "\u2726"),
      React15.createElement("h2", { id: "hp-ai-settings-title" }, tx(store.locale, "aiSettings")),
      React15.createElement("p", null, tx(store.locale, "aiSettingsHint")),
      React15.createElement(
        "label",
        { className: "hp-ai-key-field" },
        React15.createElement("span", null, tx(store.locale, "deepSeekApiKey")),
        React15.createElement("input", {
          type: "password",
          value: apiKey,
          autoComplete: "off",
          spellCheck: false,
          placeholder: store.botConfigured ? tx(store.locale, "replaceAiKey") : "sk-\u2026",
          "data-testid": "ai-key-input",
          onChange: (event) => setApiKey(event.currentTarget.value),
          onKeyDown: (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }
        })
      ),
      React15.createElement("p", { className: "hp-ai-memory-note" }, tx(store.locale, "aiMemoryOnly")),
      localError !== "" ? React15.createElement("div", { className: "hp-ai-local-error" }, localError) : null,
      React15.createElement(
        "div",
        { className: "hp-ai-settings-actions" },
        React15.createElement("button", { type: "button", className: "hp-btn", disabled: pendingRequest !== null, onClick: dismiss }, tx(store.locale, "cancel")),
        React15.createElement(
          "button",
          { type: "button", className: "hp-btn primary", disabled: !valid || pendingRequest !== null, "data-testid": "save-ai-key", onClick: submit },
          pendingRequest === null ? tx(store.locale, store.aiSettingsTableId === null ? "saveAiKey" : "saveAndAddBot") : tx(store.locale, "savingAiKey")
        )
      )
    )
  );
}

// src/client/components/PokerOverlay.tsx
function PokerOverlay(props = {}) {
  const store = useStore();
  if (!store.open) return null;
  const t = store.table;
  const inTable = t !== null && store.session !== null && t.tableId === store.session.tableId;
  const watching = t !== null && !inTable && t.tableId === store.spectateTableId;
  const showTable = inTable || watching;
  const showTableLoading = store.spectateTableId !== null && store.table === null;
  let body;
  if (showTableLoading) {
    body = React16.createElement(Spinner, { label: tx(store.locale, "loadingTable") });
  } else if (showTable && t !== null) {
    body = React16.createElement(TableView, null);
  } else {
    body = React16.createElement(LobbyView, null);
  }
  return React16.createElement(
    "div",
    { className: "hp-root" },
    store.error !== null ? React16.createElement("div", { className: "hp-toast" }, translateError(store.error, store.locale)) : null,
    React16.createElement(PokerHeader, props),
    React16.createElement("div", { className: "hp-body" }, body),
    React16.createElement(AiSettingsDialog)
  );
}

// src/client/components/SidebarButton.tsx
var React17 = __toESM(require("react"), 1);
function PokerCenterButton(props) {
  const store = useStore();
  const wide = props.wide !== false;
  const agentRunning = useAgentRunning(props);
  return React17.createElement(
    "button",
    {
      className: "hp-sidebar-btn" + (store.open ? " active" : ""),
      title: tx(store.locale, "sidebarTitle"),
      onClick: () => {
        const next = !store.open;
        Store.set({ open: next, error: null });
        if (next) connect();
      }
    },
    React17.createElement("span", { className: "spade" }, "\u2660"),
    wide ? React17.createElement("span", { className: "plabel" }, tx(store.locale, "poker")) : null,
    React17.createElement(AgentStatusBadge, { running: agentRunning, locale: store.locale, compact: !wide }),
    wide ? React17.createElement("span", { className: "hp-statusdot " + (store.connected ? "on" : "off") }) : null
  );
}

// src/client/poker.css
var poker_default = `/* dsh-poker \u2014 game-area theme & layout (UI v3).
 *
 * The game area uses ONLY the --hp-* tokens below, hard-coded dark values.
 * DSH light-theme tokens (--dsw-alias-*) are never consulted inside the game
 * area, so the poker surface can never flip to white or lose contrast. DSH
 * tokens appear only on the sidebar entry button (the integration point).
 */

/* \u2500\u2500 theme tokens \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-root {
  --hp-bg: #0a0f16;
  --hp-bg-2: #0e141d;
  --hp-surface: #131b26;
  --hp-surface-2: #1a2432;
  --hp-surface-3: #223048;
  --hp-border: #2a3850;
  --hp-border-soft: rgba(122, 145, 180, 0.22);
  --hp-text: #e9eef6;
  --hp-muted: #a4b1c2;
  --hp-accent: #e8b339;
  --hp-accent-strong: #f5c95c;
  --hp-good: #4fc07f;
  --hp-bad: #e2605a;
  --hp-violet: #a98ef0;
  --hp-felt: #0c3829;
  --hp-felt-hi: #11503a;
  --hp-felt-edge: #072219;
  --hp-felt-rim: #4a3319;
  --hp-seat-bg: rgba(13, 20, 30, 0.86);
  --hp-seat-border: rgba(148, 170, 202, 0.32);
  --hp-focus: #5b9cf0;
}

/* \u2500\u2500 shell \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-root {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  background: var(--hp-bg);
  color: var(--hp-text);
  font-family: var(--dsh-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);
  overflow: hidden;
  pointer-events: auto;
  font-size: 14px;
  line-height: 1.45;
}
.hp-root,
.hp-root * {
  box-sizing: border-box;
}

/* \u2500\u2500 compact room bar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-roombar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--hp-bg-2);
  border-bottom: 1px solid var(--hp-border);
  min-height: 44px;
}
.hp-roombar .hp-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.hp-roombar .hp-spade { color: var(--hp-accent); font-size: 16px; }
.hp-roombar .hp-table-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--hp-muted);
  font-size: 12.5px;
}
.hp-roombar .hp-table-meta .hp-tname { color: var(--hp-text); font-weight: 600; }
.hp-roombar .hp-table-meta .hp-roomid {
  font-family: ui-monospace, Menlo, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}
.hp-roombar .hp-spacer { flex: 1; }
.hp-roombar .hp-conn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--hp-muted); }
.hp-roombar .hp-conn .hp-dotpulse { width: 8px; height: 8px; border-radius: 50%; background: var(--hp-accent); animation: hp-pulse 1.4s ease-in-out infinite; flex: none; }

/* \u2500\u2500 buttons / inputs (game area) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-btn {
  background: var(--hp-surface-2);
  border: 1px solid var(--hp-border);
  color: var(--hp-text);
  border-radius: 9px;
  padding: 7px 13px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: filter 0.12s, background 0.12s, border-color 0.12s;
  white-space: nowrap;
}
.hp-btn:hover { filter: brightness(1.2); border-color: var(--hp-border-soft); }
.hp-btn:focus-visible { outline: 2px solid var(--hp-focus); outline-offset: 2px; }
.hp-btn.primary { background: #1d5c43; border-color: #2f8a63; color: #eafff4; }
.hp-btn.danger { background: rgba(150, 55, 48, 0.25); border-color: #a13d39; color: #ffb0ab; }
.hp-btn.ghost { background: transparent; border-color: transparent; }
.hp-btn:disabled { opacity: 0.45; cursor: not-allowed; filter: none; }
.hp-input {
  background: var(--hp-bg-2);
  border: 1px solid var(--hp-border);
  color: var(--hp-text);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.12s;
}
.hp-input:focus { border-color: var(--hp-focus); }
.hp-hint { font-size: 12.5px; color: var(--hp-muted); line-height: 1.5; }
.hp-err { color: var(--hp-bad); font-size: 13px; min-height: 18px; }

/* \u2500\u2500 overlay body / banners / toast / spinner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  gap: 0;
  overflow: hidden;
}
.hp-toast {
  position: absolute;
  top: 54px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--hp-surface-2);
  border: 1px solid #a13d39;
  color: #ffb0ab;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  z-index: 6;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: hp-slide-down 0.18s ease-out;
}
.hp-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 9px;
  font-size: 12.5px;
  border: 1px solid var(--hp-border);
  background: var(--hp-surface);
  color: var(--hp-muted);
}
.hp-banner.warn { color: #e8c66a; border-color: #6d5617; background: rgba(232, 198, 106, 0.08); }
.hp-spinner { width: 26px; height: 26px; border: 3px solid var(--hp-border); border-top-color: var(--hp-accent); border-radius: 50%; animation: hp-spin 0.8s linear infinite; margin: 0 auto; }
.hp-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 0; color: var(--hp-muted); font-size: 13px; }

/* \u2500\u2500 stage \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-stage {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 0 12px;
}
.hp-statusline {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 14px;
  border-radius: 0 0 10px 10px;
  background: var(--hp-bg-2);
  border: 1px solid var(--hp-border);
  border-top: none;
  font-size: 12px;
  color: var(--hp-muted);
  white-space: nowrap;
  z-index: 3;
}
.hp-statusline .hp-phase { color: var(--hp-text); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
.hp-statusline .hp-hand { font-variant-numeric: tabular-nums; }

/* the table */
.hp-felt {
  position: absolute;
  top: 52%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56%;
  aspect-ratio: 16 / 9;
  border-radius: 999px;
  background: radial-gradient(ellipse at center, var(--hp-felt-hi) 0%, var(--hp-felt) 58%, var(--hp-felt-edge) 100%);
  border: 5px solid var(--hp-felt-rim);
  box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.45), 0 6px 22px rgba(0, 0, 0, 0.4);
}
.hp-community {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 6px;
  align-items: center;
}
.hp-pot {
  position: absolute;
  top: 66%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12.5px;
  color: #ffe9b3;
  background: rgba(0, 0, 0, 0.4);
  padding: 3px 12px;
  border-radius: 999px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  animation: hp-pot-pop 0.34s ease-out;
}
.hp-waiting {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #d7ecdf;
  text-align: center;
  width: min(340px, 70%);
}
.hp-waiting .hp-bigspade { font-size: 30px; color: var(--hp-accent); opacity: 0.75; line-height: 1; }
.hp-waiting .hp-wtitle { font-size: 14px; font-weight: 600; }
.hp-waiting .hp-hint { color: #b7d3c3; }

/* playing cards */
.hp-card {
  position: relative;
  width: 52px;
  height: 72px;
  border-radius: 8px;
  background: #f4f2ec;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 5px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.45);
  line-height: 1;
  animation: hp-deal-in 0.24s ease-out both;
}
.hp-card .r { line-height: 1; font-variant-numeric: tabular-nums; }
.hp-card .s { font-size: 17px; line-height: 1; }
.hp-card.red { color: #c62828; }
.hp-card.back { background: repeating-linear-gradient(45deg, #1f4a8a, #1f4a8a 6px, #2a5ba0 6px, #2a5ba0 12px); border: 2px solid #16356b; animation: none; }
.hp-card.small { width: 34px; height: 47px; font-size: 12px; border-radius: 5px; }
.hp-card.small .s { font-size: 13px; }
.hp-card.mini { width: 26px; height: 36px; font-size: 10px; border-radius: 4px; padding: 2px 3px; }
.hp-card.mini .s { font-size: 11px; }

/* \u2500\u2500 player seat cards (desktop: absolute; mobile: flow) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-seat {
  position: absolute;
  width: 172px;
  min-height: 122px;
  transform: translate(-50%, -50%);
  background: var(--hp-seat-bg);
  border: 1px solid var(--hp-seat-border);
  border-radius: 12px;
  padding: 8px 10px 7px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  transition: border-color 0.18s, box-shadow 0.18s;
}
.hp-seat .hp-seat-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
.hp-seat .hp-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex: none;
  background: #223448;
  border: 2px solid var(--hp-seat-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #d8e6f5;
  position: relative;
}
.hp-seat .hp-sname {
  font-size: 13px;
  font-weight: 650;
  color: var(--hp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.hp-seat .hp-sstack { font-size: 12.5px; color: var(--hp-accent); font-variant-numeric: tabular-nums; }
.hp-seat .hp-srow { display: flex; align-items: center; gap: 8px; min-height: 19px; }
.hp-seat .hp-sbet {
  font-size: 11.5px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.16);
  padding: 1px 8px;
  border-radius: 999px;
  animation: hp-bet-pop 0.26s ease-out;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.hp-seat .hp-sstate { font-size: 11px; color: #ff9d97; letter-spacing: 0.06em; }
.hp-seat .hp-sstate.allin { color: var(--hp-violet); }
.hp-seat .hp-cards { display: flex; gap: 4px; min-height: 47px; align-items: flex-end; margin-top: 2px; }
.hp-seat .hp-dbtn {
  position: absolute;
  top: -9px;
  right: -7px;
  background: #d9d9d9;
  color: #111;
  font-size: 11px;
  font-weight: 800;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #111;
}
.hp-seat .hp-blind {
  position: absolute;
  top: -9px;
  left: -7px;
  background: #6d5617;
  color: #ffe9b3;
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
}
.hp-seat .hp-count { font-size: 11.5px; color: var(--hp-good); font-variant-numeric: tabular-nums; }
.hp-seat .hp-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--hp-good);
  position: absolute;
  bottom: -1px;
  right: -1px;
  border: 2px solid #0d1520;
}
.hp-seat .hp-dot.off { background: #8a8f98; }
.hp-seat.me { border-color: rgba(232, 179, 57, 0.65); box-shadow: 0 0 14px rgba(232, 179, 57, 0.25), 0 4px 14px rgba(0, 0, 0, 0.35); }
.hp-seat.turn { border-color: rgba(79, 192, 127, 0.8); animation: hp-turn-pulse 1.7s ease-in-out infinite; }
.hp-seat.winner { border-color: var(--hp-accent); animation: hp-win-glow 1.3s ease-out 2; }
.hp-seat.folded { opacity: 0.6; }
.hp-seat.folded .hp-cards { animation: hp-fold-fade 0.32s ease-in forwards; }
.hp-thought {
  position: absolute;
  left: 50%;
  bottom: -23px;
  z-index: 3;
  transform: translateX(-50%);
  padding: 3px 8px;
  color: #4d4d49;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #deded9;
  border-radius: 999px;
  box-shadow: 0 3px 10px rgba(20,20,20,.08);
  font-size: 9px;
  white-space: nowrap;
  animation: hp-thought-in 0.24s ease-out both;
}

/* \u2500\u2500 action dock \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-dock {
  flex: none;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--hp-bg-2);
  border-top: 1px solid var(--hp-border);
  padding: 10px 16px 12px;
  margin-top: 16px;
}
.hp-dock .hp-actionrow { display: flex; gap: 10px; align-items: stretch; }
.hp-action-btn {
  flex: 1;
  min-width: 108px;
  padding: 10px 12px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 13.5px;
  font-weight: 650;
  cursor: pointer;
  color: #fff;
  transition: filter 0.12s, transform 0.06s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
}
.hp-action-btn:active:not(:disabled) { transform: translateY(1px); }
.hp-action-btn:focus-visible { outline: 2px solid var(--hp-focus); outline-offset: 2px; }
.hp-action-btn:disabled { opacity: 0.42; cursor: not-allowed; filter: none; }
.hp-action-btn.fold { background: #64241f; border-color: #a13d39; color: #ffd7d4; }
.hp-action-btn.call { background: #1d5c43; border-color: #2f8a63; color: #eafff4; }
.hp-action-btn.bet { background: #6d5617; border-color: #a9872a; color: #fff3d6; }
.hp-action-btn.allin { background: #3c2f66; border-color: #7a63c4; color: #ece6ff; }
.hp-dock .hp-hint { min-height: 18px; }
.hp-raise {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  background: var(--hp-surface);
  border: 1px solid var(--hp-border);
  border-radius: 9px;
  padding: 9px 10px;
  font-size: 13px;
}
.hp-raise input[type="range"] { flex: 1; min-width: 140px; accent-color: var(--hp-accent); }
.hp-raise input[type="number"] {
  width: 96px;
  background: var(--hp-bg-2);
  border: 1px solid var(--hp-border);
  color: var(--hp-text);
  border-radius: 7px;
  padding: 6px 8px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.hp-raise .hp-minmax { font-size: 11.5px; color: var(--hp-muted); font-family: ui-monospace, Menlo, monospace; font-variant-numeric: tabular-nums; }

/* \u2500\u2500 hand history drawer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-drawer-toggle { flex: none; }
.hp-history-control {
  position: absolute;
  top: 52px;
  right: 12px;
  z-index: 6;
}
.hp-drawer {
  position: absolute;
  top: 52px;
  right: 12px;
  bottom: 12px;
  width: min(340px, calc(100vw - 24px));
  background: var(--hp-surface);
  border: 1px solid var(--hp-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  z-index: 5;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);
  animation: hp-slide-left 0.2s ease-out;
  overflow: hidden;
}
.hp-drawer .hp-drawer-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--hp-border);
  font-size: 13px;
  font-weight: 650;
  flex: none;
}
.hp-drawer .hp-drawer-head .hp-spacer { flex: 1; }
.hp-log { flex: 1; overflow: auto; padding: 8px 11px; font-size: 12px; line-height: 1.6; color: #c9d4e0; }
.hp-log .t { color: #7d8a99; font-family: ui-monospace, Menlo, monospace; margin-right: 6px; font-variant-numeric: tabular-nums; }
.hp-log .warn { color: #e8c66a; }
.hp-log .good { color: #7ee2a8; }

/* \u2500\u2500 showdown banner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-showdown {
  flex: none;
  margin: 0 auto;
  width: min(720px, calc(100% - 24px));
  padding: 9px 13px;
  border: 1px solid #a9872a;
  border-radius: 10px;
  background: rgba(232, 179, 57, 0.1);
  font-size: 13px;
  line-height: 1.6;
  animation: hp-slide-up 0.3s ease-out;
  max-height: 96px;
  overflow: auto;
}
.hp-showdown .w { color: #ffe9b3; font-weight: 650; }

/* \u2500\u2500 lobby \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-lobby {
  width: min(720px, 100%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 16px 24px;
  overflow: auto;
  height: 100%;
}
.hp-wallet {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: var(--hp-muted);
  padding: 10px 14px;
  border: 1px solid var(--hp-border);
  border-radius: 10px;
  background: var(--hp-surface);
}
.hp-wallet b { color: var(--hp-accent); font-variant-numeric: tabular-nums; }
.hp-lobby-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.hp-panel {
  background: var(--hp-surface);
  border: 1px solid var(--hp-border);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hp-panel h3 { margin: 0 0 2px; font-size: 13px; font-weight: 650; color: var(--hp-muted); letter-spacing: 0.02em; }
.hp-field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--hp-muted); }
.hp-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.hp-tablelist { display: flex; flex-direction: column; gap: 8px; max-height: 46vh; overflow: auto; }
.hp-table-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--hp-bg-2);
  border: 1px solid var(--hp-border);
  border-radius: 10px;
  transition: border-color 0.12s;
}
.hp-table-item:hover { border-color: var(--hp-border-soft); }
.hp-table-item .hp-tinfo { flex: 1; min-width: 0; }
.hp-table-item .hp-tname { font-size: 14px; font-weight: 650; color: var(--hp-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hp-table-item .hp-tmeta { font-size: 12px; color: var(--hp-muted); margin-top: 2px; }
.hp-table-actions { display: flex; align-items: center; justify-content: flex-end; gap: 7px; flex-wrap: wrap; }
.hp-delete-room { color: var(--hp-bad); }
.hp-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--hp-border); color: var(--hp-muted); flex: none; }
.hp-badge.live { color: #7ee2a8; border-color: #2f8a63; }
.hp-badge.wait { color: #e8c66a; border-color: #6d5617; }
.hp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 26px 14px;
  color: var(--hp-muted);
  text-align: center;
  border: 1px dashed var(--hp-border);
  border-radius: 12px;
}
.hp-empty .hp-bigspade { font-size: 34px; color: var(--hp-accent); opacity: 0.7; line-height: 1; }

/* \u2500\u2500 sidebar entry (DSH integration point \u2014 may follow the app theme) \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-sidebar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--dsw-alias-label-secondary, #9aa4b2);
  cursor: pointer;
  font-size: 13px;
  padding: 4px 6px;
  border-radius: 8px;
  width: 100%;
  transition: color 0.12s, background 0.12s;
}
.hp-sidebar-btn:hover, .hp-sidebar-btn.active { color: var(--dsw-alias-label-primary, #e6edf3); background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }
.hp-sidebar-btn .spade { color: #e8b339; font-size: 15px; flex: none; }
.hp-sidebar-btn .plabel { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hp-sidebar-btn .hp-statusdot { width: 7px; height: 7px; border-radius: 50%; margin-left: auto; flex: none; }
.hp-sidebar-btn .hp-statusdot.on { background: #57d98a; }
.hp-sidebar-btn .hp-statusdot.off { background: #8a8f98; }

/* \u2500\u2500 animations (restrained; disabled under reduced motion) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@keyframes hp-deal-in { from { opacity: 0; transform: translateY(10px) scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes hp-bet-pop { 0% { transform: scale(0.82); } 55% { transform: scale(1.12); } 100% { transform: scale(1); } }
@keyframes hp-pot-pop { 0% { opacity: .45; transform: translateX(-50%) scale(.86); } 65% { transform: translateX(-50%) scale(1.07); } 100% { opacity: 1; transform: translateX(-50%) scale(1); } }
@keyframes hp-thought-in { from { opacity: 0; transform: translate(-50%, 5px) scale(.96); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
@keyframes hp-fold-fade { to { opacity: 0; transform: translateY(-4px) scale(0.9); } }
@keyframes hp-win-glow { 0%, 100% { box-shadow: 0 0 12px rgba(232, 179, 57, 0.45); } 50% { box-shadow: 0 0 26px rgba(232, 179, 57, 0.9); } }
@keyframes hp-turn-pulse { 0%, 100% { box-shadow: 0 0 6px rgba(79, 192, 127, 0.4); } 50% { box-shadow: 0 0 18px rgba(79, 192, 127, 0.85); } }
@keyframes hp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes hp-spin { to { transform: rotate(360deg); } }
@keyframes hp-slide-down { from { opacity: 0; transform: translate(-50%, -6px); } to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes hp-slide-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes hp-slide-left { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }

/* \u2500\u2500 tablet (641\u20131024px) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (max-width:1024px) {
  .hp-felt { width: 62%; }
  .hp-seat { width: 160px; min-height: 114px; }
  .hp-dock .hp-actionrow { gap: 8px; }
  .hp-action-btn { min-width: 96px; }
}

/* \u2500\u2500 mobile (\u2264640px): flow layout; restructure, never shrink fonts to fit \u2500\u2500 */
@media (max-width:640px) {
  .hp-root { font-size: 14px; }
  .hp-roombar { padding: 6px 10px; gap: 8px; flex-wrap: wrap; }
  .hp-roombar .hp-table-meta { width: 100%; order: 5; padding-right: 82px; }
  .hp-roombar .hp-table-meta .hp-tname { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hp-roombar .hp-table-meta .hp-roomid { display: none; }
  .hp-roombar .hp-table-meta .hp-btn { padding-inline: 9px; }
  .hp-history-control { top: 52px; right: 10px; }
  .hp-stage { overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .hp-statusline { position: static; transform: none; width: 100%; justify-content: center; border-radius: 10px; border: 1px solid var(--hp-border); }
  .hp-felt { position: static; transform: none; width: 62%; aspect-ratio: 4 / 3; border-width: 4px; order: 3; margin: 4px 0; }
  .hp-community { top: 42%; gap: 4px; }
  .hp-card { width: 42px; height: 58px; font-size: 12px; border-radius: 6px; }
  .hp-card .s { font-size: 14px; }
  .hp-card.small { width: 30px; height: 41px; font-size: 11px; }
  .hp-card.small .s { font-size: 12px; }
  .hp-seat { position: static; transform: none; width: 47%; min-height: 0; padding: 7px 9px; border-radius: 10px; }
  .hp-seat .hp-cards { min-height: 41px; }
  .hp-seats-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; width: 100%; }
  .hp-seat.me { order: 10; width: 70%; }
  .hp-dock { padding: 8px 10px 10px; margin-top: 10px; }
  .hp-dock .hp-actionrow { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .hp-action-btn { min-width: 0; min-height: 46px; font-size: 13px; padding: 10px 6px; }
  .hp-raise { flex-direction: column; align-items: stretch; }
  .hp-raise input[type="number"] { width: 100%; }
  .hp-drawer { top: 60px; right: 8px; bottom: 8px; width: min(320px, calc(100vw - 16px)); }
  .hp-showdown { font-size: 12.5px; max-height: 88px; }
  .hp-lobby { padding: 12px 10px 20px; }
  .hp-lobby-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion:reduce) {
  .hp-root * { animation: none !important; transition: none !important; }
}

/* \u2500\u2500 reference skin: DeepSeek Harness light game-center aesthetic \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-root {
  --hp-bg: #fafaf8;
  --hp-bg-2: rgba(255, 255, 255, 0.92);
  --hp-surface: #ffffff;
  --hp-surface-2: #f5f5f2;
  --hp-surface-3: #ececea;
  --hp-border: #e6e6e2;
  --hp-border-soft: #d8d8d3;
  --hp-text: #151515;
  --hp-muted: #898985;
  --hp-accent: #2475eb;
  --hp-accent-strong: #0e63df;
  --hp-good: #20a464;
  --hp-bad: #d6534d;
  --hp-violet: #7059c9;
  --hp-felt: #efefec;
  --hp-felt-hi: #f4f4f1;
  --hp-felt-edge: #e8e8e4;
  --hp-felt-rim: transparent;
  --hp-seat-bg: transparent;
  --hp-seat-border: transparent;
  --hp-focus: #2475eb;
  background:
    radial-gradient(circle at 50% 34%, rgba(255, 255, 255, 0.96), transparent 44%),
    #fafaf8;
  color: var(--hp-text);
}

.hp-roombar {
  min-height: 48px;
  padding: 7px 18px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #ecece8;
  box-shadow: 0 1px 0 rgba(20, 20, 20, 0.02);
}
.hp-roombar .hp-brand { color: #1a1a1a; font-weight: 620; }
.hp-roombar .hp-spade { color: #111; font-size: 14px; }
.hp-roombar .hp-crumb { color: #9b9b96; font-weight: 450; }
.hp-roombar .hp-table-meta { color: #a0a09b; }
.hp-roombar .hp-table-meta .hp-tname { color: #555550; font-weight: 500; }
.hp-roombar .hp-table-meta .hp-roomid { color: #b0b0aa; }
.hp-agent-state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #8b8b86;
  font-size: 10px;
  white-space: nowrap;
}
.hp-agent-state i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a6a6a0;
}
.hp-agent-state.thinking i { background: #2475eb; animation: hp-pulse 1.25s ease-in-out infinite; }
.hp-agent-state.compact { width: 8px; overflow: hidden; }

.hp-btn {
  color: #252525;
  background: #fff;
  border-color: #e2e2de;
  border-radius: 999px;
  box-shadow: 0 1px 2px rgba(20, 20, 20, 0.03);
}
.hp-btn:hover { background: #f6f6f3; border-color: #d2d2cd; filter: none; }
.hp-btn.primary { color: #fff; background: #171717; border-color: #171717; }
.hp-btn.danger { color: #5e5e59; background: #fff; border-color: #deded9; }
.hp-btn.ghost { background: transparent; box-shadow: none; }
.hp-input {
  color: #202020;
  background: #fff;
  border-color: #dfdfda;
  box-shadow: inset 0 1px 1px rgba(20, 20, 20, 0.02);
}
.hp-hint { color: #969691; }

.hp-body { background: transparent; }
.hp-stage { padding-inline: 20px; }
.hp-statusline {
  top: 10px;
  padding: 5px 13px;
  color: #9b9b96;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #ecece7;
  border-radius: 999px;
  box-shadow: 0 3px 12px rgba(20, 20, 20, 0.035);
}
.hp-statusline .hp-phase { color: #4b4b47; font-weight: 620; letter-spacing: 0.04em; }

.hp-felt {
  top: 52%;
  width: 59%;
  aspect-ratio: 1.78 / 1;
  border: 0;
  border-radius: 44% 44% 40% 40% / 45% 45% 42% 42%;
  background:
    radial-gradient(ellipse at 50% 34%, rgba(255, 255, 255, 0.7), transparent 54%),
    linear-gradient(160deg, #f2f2ef, #ebebe7);
  box-shadow: inset 0 1px 0 #fff, 0 10px 28px rgba(25, 25, 25, 0.025);
}
.hp-felt::after {
  content: "";
  position: absolute;
  inset: 18% 22%;
  border-radius: 999px;
  background: radial-gradient(ellipse, rgba(255,255,255,.42), transparent 68%);
  pointer-events: none;
}
.hp-community { top: 48%; gap: 7px; z-index: 1; }
.hp-pot {
  top: 69%;
  z-index: 1;
  color: #666661;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid #e2e2dd;
  padding: 4px 10px 4px 26px;
  box-shadow: 0 2px 8px rgba(20,20,20,.04);
}
.hp-pot::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 50%;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  transform: translateY(-50%);
  background: #2879e8;
  box-shadow: inset 0 0 0 3px rgba(255,255,255,.46), 0 1px 2px rgba(25,75,150,.25);
}
.hp-waiting { color: #555550; }
.hp-waiting .hp-bigspade { color: #111; opacity: .85; }
.hp-waiting .hp-hint { color: #999994; }

.hp-card {
  width: 40px;
  height: 56px;
  padding: 4px 5px;
  color: #171717;
  background: #fff;
  border: 1px solid #dededa;
  border-radius: 5px;
  box-shadow: 0 2px 7px rgba(20, 20, 20, 0.09);
  font-size: 13px;
}
.hp-card.red { color: #e04842; }
.hp-card.back {
  position: relative;
  background: #fff;
  border: 1px solid #dededa;
  box-shadow: 0 2px 6px rgba(20,20,20,.08);
}
.hp-card.back::after {
  content: "\u2660";
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #1b1b1b;
  font-size: 14px;
}
.hp-card.small { width: 31px; height: 43px; border-radius: 4px; font-size: 10px; }
.hp-card.small .s { font-size: 11px; }

.hp-seat {
  width: 172px;
  min-height: 92px;
  padding: 7px 8px;
  align-items: center;
  gap: 2px;
  color: #202020;
  background: transparent;
  border-color: transparent;
  border-radius: 14px;
  box-shadow: none;
  backdrop-filter: none;
}
.hp-seat .hp-seat-head { justify-content: center; gap: 7px; overflow: visible; }
.hp-seat .hp-avatar {
  width: 36px;
  height: 36px;
  color: #fff;
  background:
    radial-gradient(circle at 35% 30%, rgba(255,255,255,.55), transparent 16%),
    linear-gradient(145deg, #4e7bd9, #2e3658 56%, #1d1d26);
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(28, 48, 86, .2), 0 0 0 1px #deded9;
  font-size: 13px;
}
.hp-seat:nth-of-type(3n+1) .hp-avatar { background: linear-gradient(145deg, #ff9d70, #e45364 58%, #712d48); }
.hp-seat:nth-of-type(3n+2) .hp-avatar { background: linear-gradient(145deg, #6fd1c0, #3570a5 58%, #2a365f); }
.hp-seat .hp-sname { flex: 0 1 auto; max-width: 92px; color: #2b2b29; font-size: 11.5px; font-weight: 600; }
.hp-seat .hp-ai-badge {
  flex: none;
  padding: 1px 5px;
  color: #2769c9;
  background: #edf4ff;
  border: 1px solid #cfe0fa;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .06em;
}
.hp-seat .hp-srow { justify-content: center; min-height: 16px; }
.hp-seat .hp-sstack { color: #666661; font-size: 10.5px; }
.hp-seat .hp-sbet {
  color: #444440;
  background: #fff;
  border-color: #e4e4df;
  box-shadow: 0 1px 4px rgba(20,20,20,.04);
  font-size: 9.5px;
}
.hp-seat .hp-sstate { color: #a05b57; font-size: 9.5px; }
.hp-seat .hp-sstate.allin { color: #6954bf; }
.hp-seat .hp-cards {
  position: absolute;
  top: -44px;
  left: 50%;
  transform: translateX(-50%);
  min-height: 43px;
  gap: 3px;
  margin: 0;
}
.hp-seat .hp-dbtn,
.hp-seat .hp-blind {
  top: -5px;
  border: 1px solid #fff;
  color: #fff;
  background: #242424;
  box-shadow: 0 1px 3px rgba(20,20,20,.18);
}
.hp-seat .hp-dbtn { right: -5px; width: 17px; height: 17px; font-size: 9px; }
.hp-seat .hp-blind { left: -7px; color: #fff; background: #202020; font-size: 8px; padding: 1px 4px; }
.hp-seat .hp-dot { width: 7px; height: 7px; background: #2db672; border-color: #fff; }
.hp-seat .hp-count { color: #2674dc; font-size: 10px; }
.hp-seat.me {
  background: rgba(255,255,255,.9);
  border-color: #83aaf0;
  box-shadow: 0 5px 16px rgba(44, 95, 180, .1);
}
.hp-seat.turn {
  border-color: #2475eb;
  background: rgba(255,255,255,.94);
  animation: hp-light-turn 1.8s ease-in-out infinite;
}
.hp-seat.turn:not(.me) {
  border-color: transparent;
  background: transparent;
  animation: none;
}
.hp-seat.turn:not(.me) .hp-avatar {
  box-shadow: 0 2px 8px rgba(28,48,86,.2), 0 0 0 2px #2475eb, 0 0 0 5px rgba(36,117,235,.1);
}
.hp-seat.winner { border-color: #efbd45; background: rgba(255,255,255,.95); }

.hp-dock {
  width: min(720px, calc(100% - 32px));
  margin: 4px auto 18px;
  padding: 4px 0 0;
  gap: 8px;
  background: transparent;
  border: 0;
}
.hp-dock .hp-actionrow { justify-content: center; gap: 10px; }
.hp-action-btn {
  flex: 0 1 160px;
  min-width: 118px;
  min-height: 40px;
  padding: 9px 18px;
  color: #292927;
  background: #fff;
  border-color: #e0e0dc;
  border-radius: 999px;
  box-shadow: 0 2px 7px rgba(20,20,20,.045);
  font-size: 12px;
  font-weight: 580;
}
.hp-action-btn.fold,
.hp-action-btn.call,
.hp-action-btn.bet,
.hp-action-btn.allin { color: #292927; background: #fff; border-color: #dfdfda; }
.hp-action-btn.primary-action {
  color: #fff;
  background: #171717;
  border-color: #171717;
  box-shadow: 0 4px 11px rgba(20,20,20,.12);
}
.hp-action-btn:disabled { opacity: .38; }
.hp-dock .hp-hint { min-height: 16px; text-align: center; color: #a0a09a; font-size: 10.5px; }
.hp-dock .hp-hint-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.hp-add-bot-inline {
  padding: 3px 9px;
  border: 1px solid #deded9;
  border-radius: 999px;
  color: #656560;
  background: #fff;
  font: inherit;
  cursor: pointer;
}
.hp-add-bot-inline:hover:not(:disabled) { color: #171717; border-color: #aaa9a2; }
.hp-add-bot-inline:disabled { opacity: .42; cursor: not-allowed; }
.hp-bet-presets {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 30px;
}
.hp-raise-quick { display: flex; align-items: center; gap: 5px; }
.hp-preset {
  min-width: 42px;
  height: 24px;
  padding: 0 9px;
  color: #777772;
  background: #fff;
  border: 1px solid #e3e3de;
  border-radius: 999px;
  font-size: 9.5px;
  cursor: pointer;
}
.hp-preset:hover:not(:disabled) { color: #171717; border-color: #cfcfca; }
.hp-preset.selected { color: #171717; border-color: #a9c6f8; background: #f4f8ff; }
.hp-preset:disabled { opacity: .42; cursor: default; }
.hp-preset.allin { color: #555550; }
.hp-preset-track {
  width: 120px;
  height: 14px;
  margin: 0;
  padding: 0;
  accent-color: #2475eb;
  cursor: pointer;
}
.hp-preset-track:disabled { opacity: .42; cursor: default; }
.hp-preset-value { min-width: 48px; color: #888883; font-size: 9.5px; }
.hp-raise-input {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #858580;
  font-size: 9.5px;
}
.hp-raise-input input {
  width: 72px;
  padding: 4px 6px;
  color: #333330;
  background: #fff;
  border: 1px solid #deded9;
  border-radius: 7px;
  font: inherit;
  font-variant-numeric: tabular-nums;
}
.hp-raise-input strong { min-width: 42px; color: #555550; font-variant-numeric: tabular-nums; }

.hp-history-control { top: 57px; }
.hp-drawer {
  top: 56px;
  background: rgba(255,255,255,.97);
  border-color: #e2e2dd;
  box-shadow: 0 16px 48px rgba(30,30,30,.1);
}
.hp-drawer .hp-drawer-head { border-color: #ecece8; color: #30302e; }
.hp-log { color: #656560; }
.hp-log .t { color: #aaa9a3; }
.hp-showdown { color: #5e553e; background: #fffdf6; border-color: #eadba9; }
.hp-showdown .w { color: #806622; }

.hp-lobby { color: #222; }
.hp-wallet,
.hp-panel { background: #fff; border-color: #e7e7e2; box-shadow: 0 4px 18px rgba(20,20,20,.025); }
.hp-wallet { color: #7b7b76; }
.hp-wallet b { color: #222; }
.hp-panel h3 { color: #666661; }
.hp-field { color: #858580; }
.hp-table-item { background: #fafaf8; border-color: #e8e8e3; }
.hp-table-item .hp-tname { color: #222; }
.hp-table-item .hp-tmeta { color: #92928d; }
.hp-empty { color: #92928d; border-color: #deded9; }
.hp-empty .hp-bigspade { color: #222; }

/* \u2500\u2500 local AI configuration \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hp-ai-config::before {
  content: "";
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: #c4c4bf;
}
.hp-ai-config.configured::before {
  background: #35a46f;
  box-shadow: 0 0 0 3px rgba(53,164,111,.12);
}
.hp-ai-settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(20,24,30,.46);
  backdrop-filter: blur(5px);
}
.hp-ai-settings {
  width: min(430px, calc(100vw - 40px));
  padding: 24px;
  color: #2d2d2a;
  background: #fff;
  border: 1px solid #deded8;
  border-radius: 20px;
  box-shadow: 0 24px 80px rgba(20,24,30,.22);
  animation: hp-ai-dialog-in .18s ease-out both;
}
.hp-ai-settings-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 14px;
  color: #185fb7;
  background: #edf5ff;
  border-radius: 11px;
  font-size: 18px;
}
.hp-ai-settings h2 { margin: 0; color: #20201e; font-size: 20px; line-height: 1.25; }
.hp-ai-settings > p { margin: 8px 0 18px; color: #72726d; font-size: 13px; }
.hp-ai-key-field { display: grid; gap: 7px; color: #555550; font-size: 12px; font-weight: 650; }
.hp-ai-key-field input {
  width: 100%;
  min-height: 42px;
  padding: 9px 11px;
  color: #222;
  background: #fafaf8;
  border: 1px solid #d8d8d2;
  border-radius: 10px;
  outline: none;
  font: 500 13px ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hp-ai-key-field input:focus { border-color: #6b9ee4; box-shadow: 0 0 0 3px rgba(57,123,216,.12); }
.hp-ai-settings .hp-ai-memory-note { margin: 10px 0 0; color: #888883; font-size: 11px; line-height: 1.55; }
.hp-ai-local-error { margin-top: 10px; color: #bc433d; font-size: 12px; }
.hp-ai-settings-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 20px; }
@keyframes hp-ai-dialog-in { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }

/* \u2500\u2500 table storytelling: focus, actions, chips and character reactions \u2500\u2500\u2500\u2500\u2500 */
.hp-stage.has-action .hp-seat:not(.turn):not(.me) { opacity: .76; filter: saturate(.82); }
.hp-stage.has-action .hp-seat.turn { z-index: 4; }
.hp-seat.turn .hp-sname { color: #111; font-weight: 720; }
.hp-seat.character-thinking .hp-avatar { animation: hp-character-think 1.4s ease-in-out infinite; }
.hp-seat.character-acting .hp-avatar { animation: hp-character-act .42s ease-out; }
.hp-seat.character-reacting .hp-avatar { animation: hp-character-react .72s cubic-bezier(.2,.8,.2,1); }
.hp-seat.character-idle .hp-avatar { filter: grayscale(.32); opacity: .78; }
.hp-seat .hp-card.back { animation: hp-deal-in .28s ease-out both; }
.hp-last-action {
  min-height: 17px;
  padding: 1px 7px;
  color: #686863;
  background: rgba(255,255,255,.88);
  border: 1px solid #e2e2dd;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(20,20,20,.04);
  font-size: 9px;
  line-height: 14px;
  white-space: nowrap;
  animation: hp-action-reveal .24s ease-out both;
}
.hp-last-action[data-action="raise"],
.hp-last-action[data-action="bet"],
.hp-last-action[data-action="allin"] { color: #1f67c5; border-color: #cbdcf8; background: #f4f8ff; }
.hp-win-payout {
  position: absolute;
  top: 7px;
  right: -8px;
  z-index: 5;
  padding: 3px 8px;
  color: #72530c;
  background: #fff8dc;
  border: 1px solid #eacb70;
  border-radius: 999px;
  box-shadow: 0 5px 16px rgba(151,105,15,.16);
  font-size: 10px;
  font-weight: 750;
  animation: hp-payout-rise .72s cubic-bezier(.2,.8,.2,1) both;
}
.hp-table-bet {
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transform: translate(-50%, -50%);
  padding: 3px 8px 3px 6px;
  color: #555550;
  background: rgba(255,255,255,.94);
  border: 1px solid #ddddda;
  border-radius: 999px;
  box-shadow: 0 3px 10px rgba(20,20,20,.07);
  font-size: 9.5px;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  animation: hp-chip-to-pot .46s cubic-bezier(.18,.8,.28,1) both;
}
.hp-table-bet i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #2777e7;
  border: 2px dashed rgba(255,255,255,.8);
  box-shadow: 3px -2px 0 #f05e69, 6px -4px 0 #f0bc45;
}
.hp-dock.is-my-turn {
  width: min(760px, calc(100% - 32px));
  padding: 10px 14px 9px;
  background: rgba(255,255,255,.94);
  border: 1px solid #e5e5e0;
  border-radius: 18px;
  box-shadow: 0 12px 32px rgba(30,30,30,.09);
  animation: hp-dock-focus .28s ease-out both;
}

@media (min-width:641px) {
  .hp-seat .hp-sbet { display: none; }
}

/* Short desktop windows compress the felt and the bottom rail into the same
 * vertical band. Keep the viewer's cards beside their seat so they never
 * cross the centre-line pot label. */
@media (min-width:641px) and (max-height:680px) {
  .hp-pot { top: 57%; }
  .hp-seat.me .hp-cards {
    top: 50%;
    left: calc(100% + 5px);
    transform: translateY(-50%);
  }
}

@keyframes hp-light-turn {
  0%, 100% { box-shadow: 0 4px 14px rgba(36,117,235,.08); }
  50% { box-shadow: 0 5px 22px rgba(36,117,235,.2); }
}
@keyframes hp-chip-to-pot {
  from { opacity: 0; transform: translate(calc(-50% + var(--hp-chip-from-x)), calc(-50% + var(--hp-chip-from-y))) scale(.72); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes hp-payout-rise {
  0% { opacity: 0; transform: translateY(14px) scale(.82); }
  62% { opacity: 1; transform: translateY(-4px) scale(1.08); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes hp-action-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes hp-character-think { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes hp-character-act { 0% { transform: scale(.88); } 65% { transform: scale(1.1); } 100% { transform: scale(1); } }
@keyframes hp-character-react { 0% { transform: rotate(-5deg) scale(.88); } 55% { transform: rotate(4deg) scale(1.14); } 100% { transform: none; } }
@keyframes hp-dock-focus { from { opacity: .6; transform: translateY(8px); } to { opacity: 1; transform: none; } }

@media (max-width:640px) {
  .hp-root { background: #fafaf8; }
  .hp-roombar { padding: 6px 10px; }
  .hp-roombar .hp-table-meta { padding-right: 76px; }
  .hp-roombar .hp-brand .hp-crumb { display: none; }
  .hp-history-control { top: 52px; }
  .hp-stage { padding: 8px 10px; gap: 8px; }
  .hp-statusline { margin-top: 2px; background: #fff; }
  .hp-felt { position: relative; top: auto; left: auto; width: 68%; background: linear-gradient(160deg, #f1f1ee, #e9e9e5); border: 0; }
  .hp-seat { width: 47%; min-height: 78px; padding: 6px; }
  .hp-seat.me { width: 70%; }
  .hp-seat .hp-cards { position: static; transform: none; min-height: 41px; order: -1; }
  .hp-dock { width: calc(100% - 20px); margin-bottom: 10px; }
  .hp-dock.is-my-turn {
    width: 100%;
    margin: 0;
    padding: 13px 12px max(10px, env(safe-area-inset-bottom));
    border-width: 1px 0 0;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -12px 34px rgba(30,30,30,.1);
  }
  .hp-dock.has-raise::before {
    content: "";
    width: 34px;
    height: 4px;
    margin: -5px auto 2px;
    background: #d5d5d0;
    border-radius: 999px;
  }
  .hp-bet-presets {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 7px 8px;
    padding: 2px 0 3px;
    overflow: visible;
  }
  .hp-preset { min-width: 0; width: 100%; height: 30px; padding-inline: 4px; font-size: 10px; }
  .hp-raise-quick { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(5, 1fr); width: 100%; gap: 5px; }
  .hp-preset-track { display: block; grid-column: 1 / -1; width: 100%; height: 20px; }
  .hp-raise-input { justify-self: start; font-size: 10px; }
  .hp-raise-input input { width: 76px; min-height: 34px; font-size: 12px; }
  .hp-raise-input span,
  .hp-raise-input strong { display: inline; }
  .hp-bet-presets > .hp-preset.allin { align-self: center; width: auto; min-width: 58px; }
  .hp-dock .hp-actionrow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
  .hp-action-btn { min-width: 0; min-height: 46px; padding-inline: 5px; }
  .hp-raise { border-radius: 16px; }
  .hp-ai-config { max-width: 40px; overflow: hidden; padding-inline: 11px; color: transparent; gap: 0; }
  .hp-ai-config::before { width: 8px; height: 8px; }
  .hp-ai-settings-backdrop { align-items: flex-end; padding: 0; }
  .hp-ai-settings {
    width: 100%;
    max-height: calc(100dvh - 24px);
    overflow-y: auto;
    padding: 22px 18px max(18px, env(safe-area-inset-bottom));
    border-width: 1px 0 0;
    border-radius: 22px 22px 0 0;
  }
  .hp-ai-settings h2 { font-size: 20px; }
  .hp-ai-settings > p,
  .hp-ai-key-field input { font-size: 13px; }
  .hp-ai-settings .hp-ai-memory-note { font-size: 11px; }
  .hp-ai-settings-actions { display: grid; grid-template-columns: 1fr 1.35fr; }
  .hp-ai-settings-actions .hp-btn { justify-content: center; min-height: 44px; }
  .hp-table-item { align-items: flex-start; flex-wrap: wrap; }
  .hp-table-actions { width: 100%; justify-content: flex-start; }
  .hp-table-actions .hp-btn { min-height: 40px; }
}

@media (prefers-reduced-motion:reduce) {
  .hp-root * { animation: none !important; transition: none !important; }
}
`;

// src/client/styles.ts
var CSS = poker_default;
function injectStyle() {
  const id = "dsh-poker/styles";
  if (typeof document === "undefined") return () => {
  };
  if (document.querySelector(`style[data-plugin-css="${id}"]`) !== null) return () => {
  };
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-poker";
  tag.dataset.pluginCss = id;
  tag.textContent = CSS;
  document.head.appendChild(tag);
  return () => {
    tag.remove();
  };
}

// src/client/plugin.ts
var name = "dsh-poker";
var inject = ["slots"];
function apply(ctx) {
  ctx.effect(() => injectStyle(), "dsh-poker: styles");
  ctx.effect(() => () => disposeStore(), "dsh-poker: transport");
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  slots.inject(
    "sidebar.footer.action",
    () => slots.register(
      { name: "sidebar.footer.action", id: "poker-center", order: 30, label: "Poker" },
      (slotProps) => React18.createElement(PokerCenterButton, { ...slotProps, wide: slotProps.wide !== false })
    )
  );
  slots.inject(
    "shell.overlay",
    () => slots.register(
      { name: "shell.overlay", id: "poker-table", order: 40 },
      (slotProps) => React18.createElement(PokerOverlay, slotProps)
    )
  );
}

// src/client/test-hooks.ts
var test_hooks_exports = {};
__export(test_hooks_exports, {
  CSS: () => CSS,
  CardView: () => CardView,
  LobbyView: () => LobbyView,
  PokerCenterButton: () => PokerCenterButton,
  PokerOverlay: () => PokerOverlay,
  SeatView: () => PlayerSeat,
  Store: () => Store,
  TableView: () => TableView,
  createTable: () => createTable,
  displayNickname: () => displayNickname,
  handleMessage: () => handleMessage,
  joinTable: () => joinTable,
  leaveTable: () => leaveTable,
  playAction: () => playAction,
  rid: () => rid,
  seatBoxes: () => seatBoxes,
  seatPositions: () => seatPositions,
  seatPositionsPx: () => seatPositionsPx,
  send: () => send,
  setLocale: () => setLocale,
  stopWatching: () => stopWatching,
  translateError: () => translateError,
  translateHandLabel: () => translateHandLabel,
  translateLog: () => translateLog,
  tx: () => tx,
  watchTable: () => watchTable
});

// src/client/entry.ts
var __test = test_hooks_exports;

    return module.exports;
  },
});
