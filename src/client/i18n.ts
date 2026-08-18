/** Complete client-side language modes. The wire protocol stays English. */
export type Locale = "zh" | "en";

const STORAGE_KEY = "dsh-poker-locale";

const zh = {
  gameCenter: "游戏中心",
  poker: "德州扑克",
  connecting: "正在连接游戏服务器…",
  createTable: "创建牌桌",
  nickname: "你的昵称",
  tableName: "牌桌名称",
  tableNamePlaceholder: "周五牌局",
  seats: "座位数",
  openTables: "开放牌桌",
  noTables: "暂时没有牌桌",
  noTablesHint: "创建一桌，或输入朋友发来的房间 ID。",
  players: "名玩家",
  blinds: "盲注",
  buyIn: "买入",
  room: "房间",
  playing: "游戏中",
  paused: "已暂停",
  waiting: "等待中",
  watch: "观战",
  join: "加入",
  playTokens: "游戏筹码",
  defaultBuyIn: "默认买入",
  joinByRoom: "通过房间 ID 加入",
  pasteRoom: "粘贴房间 ID",
  buyInChips: "买入筹码（每桌）",
  copyRoom: "复制房间",
  copyRoomTitle: "复制房间 ID",
  reconnecting: "正在重新连接…",
  leaveTable: "离开牌桌",
  backLobby: "返回大厅",
  close: "关闭",
  loadingTable: "正在载入牌桌…",
  connectionLost: "连接已断开，正在重新连接…",
  phaseIdle: "等待入座",
  phasePreflop: "翻牌前",
  phaseFlop: "翻牌",
  phaseTurn: "转牌",
  phaseRiver: "河牌",
  phaseShowdown: "摊牌",
  hand: "第 {n} 手",
  pot: "底池",
  waitingPlayers: "等待玩家入座",
  inviteHint: "{seated}/{max} 人 · 复制房间 ID 邀请朋友",
  folded: "已弃牌",
  nextHand: "等待下一手",
  allIn: "全下",
  you: "你",
  bot: "机器人",
  seconds: "{n} 秒",
  bet: "下注",
  raise: "加注",
  call: "跟注",
  check: "过牌",
  fold: "弃牌",
  joinTable: "加入牌桌",
  disconnectedHint: "连接中断，正在重连…",
  spectatingHint: "正在观战 · 入座后即可参与",
  waitingOthers: "等待其他玩家加入…",
  waitingPlayerAction: "等待 {name} 操作…",
  otherPlayer: "其他玩家",
  yourTurn: "轮到你了",
  tableFull: "牌桌已满",
  addBot: "＋ 加入机器人",
  waitingStart: "等待牌局开始…",
  addBotHint: "没有真人？添加机器人后立即开局",
  betAmount: "下注金额",
  raiseAmount: "加注金额",
  botNextHand: "机器人将在下一手牌加入",
  seatsFull: "{occupied}/{max} 已满",
  addBotCompact: "＋ 机器人 · {occupied}/{max}",
  collapseHistory: "收起记录",
  handHistory: "牌局记录",
  wins: "赢得",
  showdown: "摊牌",
  sidebarTitle: "游戏中心（德州扑克）",
} as const;

type TranslationKey = keyof typeof zh;

const en: Record<TranslationKey, string> = {
  gameCenter: "Game Center",
  poker: "Texas Hold'em",
  connecting: "Connecting to game server…",
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
  reconnecting: "Reconnecting…",
  leaveTable: "Leave table",
  backLobby: "Back to lobby",
  close: "Close",
  loadingTable: "Loading table…",
  connectionLost: "Connection lost — reconnecting…",
  phaseIdle: "Waiting for players",
  phasePreflop: "Pre-flop",
  phaseFlop: "Flop",
  phaseTurn: "Turn",
  phaseRiver: "River",
  phaseShowdown: "Showdown",
  hand: "Hand #{n}",
  pot: "Pot",
  waitingPlayers: "Waiting for players",
  inviteHint: "{seated}/{max} seated · copy the room ID to invite friends",
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
  disconnectedHint: "Connection lost — reconnecting…",
  spectatingHint: "Spectating · take a seat to play",
  waitingOthers: "Waiting for other players…",
  waitingPlayerAction: "Waiting for {name}…",
  otherPlayer: "another player",
  yourTurn: "Your turn",
  tableFull: "Table full",
  addBot: "+ Add bot",
  waitingStart: "Waiting for the game to start…",
  addBotHint: "No one else here? Add a bot to start now",
  betAmount: "Bet amount",
  raiseAmount: "Raise amount",
  botNextHand: "The bot will join the next hand",
  seatsFull: "{occupied}/{max} full",
  addBotCompact: "+ Bot · {occupied}/{max}",
  collapseHistory: "Hide history",
  handHistory: "Hand History",
  wins: "wins",
  showdown: "Showdown",
  sidebarTitle: "Game Center (Texas Hold'em)",
};

export function tx(locale: Locale, key: TranslationKey, values: Record<string, string | number> = {}): string {
  const template = (locale === "zh" ? zh : en)[key];
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(values[name] ?? ""));
}

export function readLocale(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh";
  } catch (_error) {
    return "zh";
  }
}

export function writeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch (_error) {
    /* storage can be unavailable in private or server-rendered contexts */
  }
}

export function displayNickname(nickname: string, isBot: boolean, locale: Locale): string {
  if (!isBot || locale === "en") return nickname;
  const match = /^AI Player(?: (\d+))?$/.exec(nickname);
  if (match === null) return nickname;
  return match[1] === undefined ? "机器人" : `机器人 ${match[1]}`;
}

export function translateHandLabel(label: string, locale: Locale): string {
  if (locale === "en") return label;
  const rules: Array<[RegExp, (...m: string[]) => string]> = [
    [/^Royal Flush$/, () => "皇家同花顺"],
    [/^Straight Flush, (.+) high$/, (_all, rank) => `${rank} 高同花顺`],
    [/^Four of a Kind, (.+)s$/, (_all, rank) => `${rank} 四条`],
    [/^Full House, (.+)s over (.+)s$/, (_all, trips, pair) => `${trips} 葫芦（带 ${pair} 对）`],
    [/^Flush, (.+) high$/, (_all, rank) => `${rank} 高同花`],
    [/^Straight, (.+) high$/, (_all, rank) => `${rank} 高顺子`],
    [/^Three of a Kind, (.+)s$/, (_all, rank) => `${rank} 三条`],
    [/^Two Pair, (.+)s and (.+)s$/, (_all, high, low) => `两对（${high} 和 ${low}）`],
    [/^Pair of (.+)s$/, (_all, rank) => `${rank} 对`],
    [/^High Card (.+)$/, (_all, rank) => `${rank} 高牌`],
  ];
  for (const [pattern, render] of rules) {
    const match = pattern.exec(label);
    if (match !== null) return render(...match);
  }
  return label;
}

function botNames(text: string, locale: Locale): string {
  if (locale === "en") return text;
  return text.replace(/AI Player(?: \d+)?/g, (name) => displayNickname(name, true, locale));
}

/** Translate stable English server log messages without changing the protocol. */
export function translateLog(text: string, locale: Locale): string {
  if (locale === "en") return text;
  const source = botNames(text, locale);
  const rules: Array<[RegExp, (...m: string[]) => string]> = [
    [/^Table "(.+)" created \(blinds (\d+)\/(\d+), buy-in (\d+)\)\.$/, (_a, name, sb, bb, buyIn) => `牌桌“${name}”已创建（盲注 ${sb}/${bb}，买入 ${buyIn}）。`],
    [/^(.+) joined at seat (\d+) \(AI, buy-in (\d+)\)\.$/, (_a, name, seat, buyIn) => `${name} 作为机器人加入 ${seat} 号座位（买入 ${buyIn}）。`],
    [/^(.+) joined at seat (\d+) \(buy-in (\d+)\)\.$/, (_a, name, seat, buyIn) => `${name} 加入 ${seat} 号座位（买入 ${buyIn}）。`],
    [/^(.+) left the table \(cashed out (\d+)\)\.$/, (_a, name, amount) => `${name} 离开牌桌（兑回 ${amount}）。`],
    [/^Waiting for at least 2 players to start a hand\.$/, () => "至少需要 2 名玩家才能开始牌局。"],
    [/^Hand #(\d+) started — dealer: (.+)\. Blinds (\d+)\/(\d+)\.$/, (_a, hand, dealer, sb, bb) => `第 ${hand} 手开始——庄家：${dealer}。盲注 ${sb}/${bb}。`],
    [/^(.+) folds\.$/, (_a, name) => `${name} 弃牌。`],
    [/^(.+) checks\.$/, (_a, name) => `${name} 过牌。`],
    [/^(.+) calls all-in \((\d+)\)\.$/, (_a, name, amount) => `${name} 跟注并全下（${amount}）。`],
    [/^(.+) calls (\d+)\.$/, (_a, name, amount) => `${name} 跟注 ${amount}。`],
    [/^(.+) bets (\d+)\.$/, (_a, name, amount) => `${name} 下注 ${amount}。`],
    [/^(.+) raises to (\d+)\.$/, (_a, name, amount) => `${name} 加注到 ${amount}。`],
    [/^(.+) is all-in for (\d+)\.$/, (_a, name, amount) => `${name} 全下 ${amount}。`],
    [/^(.+) left the hand \((.+)\)\.$/, (_a, name, reason) => `${name} 离开本手牌（${reason === "left the table" ? "离开牌桌" : reason === "last human left" ? "最后一名真人已离开" : reason}）。`],
    [/^(.+) auto-folds \(timeout\)\.$/, (_a, name) => `${name} 超时自动弃牌。`],
    [/^(.+) auto-checks \(timeout\)\.$/, (_a, name) => `${name} 超时自动过牌。`],
    [/^Flop dealt\.$/, () => "已发翻牌。"],
    [/^Turn dealt\.$/, () => "已发转牌。"],
    [/^River dealt\.$/, () => "已发河牌。"],
    [/^All-in runout: flop dealt\.$/, () => "全下发牌：已发翻牌。"],
    [/^All-in runout: turn dealt\.$/, () => "全下发牌：已发转牌。"],
    [/^All-in runout: river dealt\.$/, () => "全下发牌：已发河牌。"],
    [/^(.+) wins (\d+) — everyone else folded\.$/, (_a, name, amount) => `${name} 赢得 ${amount}——其他玩家均已弃牌。`],
    [/^Showdown: (.+)\.$/, (_a, result) => `摊牌：${result.replace(/ wins /g, " 赢得 ")}。`],
    [/^Showdown$/, () => "摊牌"],
    [/^Hand #(\d+) finished\.$/, (_a, hand) => `第 ${hand} 手结束。`],
    [/^Hand #(\d+) started\.$/, (_a, hand) => `第 ${hand} 手开始。`],
  ];
  for (const [pattern, render] of rules) {
    const match = pattern.exec(source);
    if (match !== null) return render(...match);
  }
  return source;
}

const ERROR_ZH: Record<string, string> = {
  "WebSocket unavailable": "无法使用网络连接",
  "invalid message": "请求内容无效",
  "session expired — join the table again": "会话已过期，请重新加入牌桌",
  "hand already in progress": "本手牌已经开始",
  "no hand in progress": "当前没有进行中的牌局",
  "player not in hand": "你不在本手牌中",
  "player is not active": "当前玩家不能操作",
  "player is all-in": "玩家已经全下",
  "not your turn": "还没轮到你",
  "cannot check when facing a bet": "面对下注时不能过牌",
  "cannot bet when facing a bet": "面对下注时只能加注",
  "cannot raise without a bet to raise": "当前没有可加注的下注",
  "betting is not open for this player (short all-in did not reopen)": "短码全下未重新开放加注",
  "join the table before adding a bot": "请先加入牌桌，再添加机器人",
  "table is full": "牌桌已满",
  "not seated at this table": "你没有在这张牌桌入座",
  "not authenticated": "身份验证失败",
  "identity mismatch": "身份信息不匹配",
  "identity token mismatch": "身份令牌不匹配",
  "only a seated player can add a bot": "只有已入座的真人玩家可以添加机器人",
  "already seated at this table": "你已经在这张牌桌入座",
  "buy-in must be positive": "买入金额必须大于零",
  "buy-in too large": "买入金额过高",
  "player is leaving": "玩家正在离开牌桌",
  "table not found": "没有找到该牌桌",
  "bot wallet too low": "机器人筹码不足",
  "AI bot is unavailable — configure a server-side API key and restart dsh web": "机器人不可用——请配置服务器端 API 密钥并重启服务",
};

export function translateError(message: string, locale: Locale): string {
  if (locale === "en") return message;
  const exact = ERROR_ZH[message];
  if (exact !== undefined) return exact;
  let match = /^bet must be between (\d+) and (\d+)$/.exec(message);
  if (match !== null) return `下注金额必须在 ${match[1]} 到 ${match[2]} 之间`;
  match = /^raise must be between (\d+) and (\d+)$/.exec(message);
  if (match !== null) return `加注金额必须在 ${match[1]} 到 ${match[2]} 之间`;
  match = /^wallet too low: (\d+) < (\d+)$/.exec(message);
  if (match !== null) return `筹码余额不足：${match[1]}，需要 ${match[2]}`;
  if (/^stale command/.test(message) || /^stale-version/.test(message)) return "牌局状态已更新，请重试";
  return botNames(message, locale);
}
