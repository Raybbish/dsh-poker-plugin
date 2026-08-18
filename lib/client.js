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
var React14 = __toESM(require("react"), 1);

// src/client/components/PokerOverlay.tsx
var React12 = __toESM(require("react"), 1);

// src/client/store.ts
var React = __toESM(require("react"), 1);
var Store = {
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
var React2 = __toESM(require("react"), 1);
function PokerHeader() {
  const store = useStore();
  const t = store.table;
  const inTable = t !== null && store.session !== null && t.tableId === store.session.tableId;
  const watching = t !== null && !inTable && t.tableId === store.spectateTableId;
  const showMeta = inTable || watching;
  return React2.createElement(
    "div",
    { className: "hp-roombar" },
    React2.createElement(
      "div",
      { className: "hp-brand" },
      React2.createElement("span", { className: "hp-spade" }, "\u2660"),
      React2.createElement("span", null, "\u6E38\u620F\u4E2D\u5FC3"),
      React2.createElement("span", { className: "hp-crumb" }, "/ \u5FB7\u5DDE\u6251\u514B")
    ),
    showMeta && t !== null ? React2.createElement(
      "span",
      { className: "hp-table-meta" },
      React2.createElement("span", { className: "hp-tname" }, t.name),
      React2.createElement("span", { className: "hp-roomid" }, t.tableId),
      React2.createElement("button", {
        className: "hp-btn",
        title: "Copy room ID",
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
      }, "\u590D\u5236\u623F\u95F4")
    ) : null,
    React2.createElement("div", { className: "hp-spacer" }),
    !store.connected ? React2.createElement("span", { className: "hp-conn" }, React2.createElement("div", { className: "hp-dotpulse" }), "\u91CD\u65B0\u8FDE\u63A5\u4E2D\u2026") : null,
    inTable ? React2.createElement("button", { className: "hp-btn danger", onClick: leaveTable }, "\u79BB\u5F00\u724C\u684C") : null,
    watching ? React2.createElement("button", { className: "hp-btn", onClick: stopWatching }, "\u8FD4\u56DE\u5927\u5385") : null,
    React2.createElement("button", { className: "hp-btn", onClick: () => Store.set({ open: false }) }, "\u5173\u95ED")
  );
}

// src/client/components/TableView.tsx
var React10 = __toESM(require("react"), 1);

// src/client/components/PokerStage.tsx
var React7 = __toESM(require("react"), 1);

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
  ]
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
  const n = Math.min(Math.max(count, 2), 6);
  if (!compact && n === 6 && safeW < 4 * SEAT_W + 3 * 16) {
    return DESKTOP_6_NARROW;
  }
  const table = compact ? COMPACT : DESKTOP;
  return table[n] ?? table[6];
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
var React4 = __toESM(require("react"), 1);

// src/client/components/ui.tsx
var React3 = __toESM(require("react"), 1);
function CardView(props) {
  const { card } = props;
  let cls = "hp-card";
  if (props.mini) cls += " mini";
  else if (props.small) cls += " small";
  const style = props.delay !== void 0 ? { animationDelay: `${props.delay}ms` } : void 0;
  if (card === null || card === void 0) return React3.createElement("div", { className: cls + " back" });
  cls += suitRed(card.suit) ? " red" : "";
  return React3.createElement(
    "div",
    { className: cls, style },
    React3.createElement("span", { className: "r" }, cardLabel(card.rank)),
    React3.createElement("span", { className: "s" }, suitChar(card.suit))
  );
}
function Badges(props) {
  const els = [];
  if (props.isDealer) els.push(React3.createElement("div", { key: "d", className: "hp-dbtn" }, "D"));
  if (props.isSmallBlind) els.push(React3.createElement("div", { key: "sb", className: "hp-blind" }, "SB"));
  if (props.isBigBlind) els.push(React3.createElement("div", { key: "bb", className: "hp-blind" }, "BB"));
  return React3.createElement(React3.Fragment, null, els);
}
function Spinner(props) {
  return React3.createElement(
    "div",
    { className: "hp-loading" },
    React3.createElement("div", { className: "hp-spinner" }),
    React3.createElement("div", null, props.label)
  );
}

// src/client/components/PlayerSeat.tsx
function PlayerSeat(props) {
  const { seat } = props;
  if (seat === void 0 || seat.playerId === "") return null;
  let cards = null;
  if (seat.holeCards !== void 0 && seat.holeCards.length > 0) {
    cards = React4.createElement(
      "div",
      { className: "hp-cards" },
      seat.holeCards.map((c, i) => React4.createElement(CardView, { key: `h${props.handNumber}-${i}`, card: c, small: true, delay: 90 + i * 90 }))
    );
  } else if (!seat.folded && !seat.excluded) {
    cards = React4.createElement(
      "div",
      { className: "hp-cards" },
      React4.createElement(CardView, { key: `b${props.handNumber}-0`, card: null, small: true }),
      React4.createElement(CardView, { key: `b${props.handNumber}-1`, card: null, small: true })
    );
  }
  let stateText = null;
  if (seat.folded) stateText = React4.createElement("div", { className: "hp-sstate" }, "\u5DF2\u5F03\u724C");
  else if (seat.excluded) stateText = React4.createElement("div", { className: "hp-sstate" }, "\u7B49\u5F85\u4E0B\u4E00\u624B");
  else if (seat.allIn) stateText = React4.createElement("div", { className: "hp-sstate allin" }, "\u5168\u4E0B");
  const countdown = seat.isTurn && props.deadlineMs > 0 && props.secondsLeft !== null ? React4.createElement("div", { className: "hp-count" }, `${props.secondsLeft}s`) : null;
  let cls = "hp-seat";
  if (seat.isMe) cls += " me";
  if (seat.isTurn) cls += " turn";
  if (seat.folded) cls += " folded";
  if (props.isWinner) cls += " winner";
  if (props.className) cls += " " + props.className;
  return React4.createElement(
    "div",
    { className: cls, style: props.style },
    React4.createElement(
      "div",
      { className: "hp-seat-head" },
      React4.createElement(
        "div",
        { className: "hp-avatar" },
        (seat.nickname || "?").slice(0, 1).toUpperCase(),
        React4.createElement(Badges, { isDealer: seat.isDealer, isSmallBlind: seat.isSmallBlind, isBigBlind: seat.isBigBlind }),
        React4.createElement("div", { className: "hp-dot" + (seat.connected ? "" : " off") })
      ),
      React4.createElement("div", { className: "hp-sname" }, seat.nickname + (seat.isMe ? "\uFF08\u4F60\uFF09" : "")),
      seat.isBot ? React4.createElement("span", { className: "hp-ai-badge" }, "AI") : null,
      countdown
    ),
    React4.createElement(
      "div",
      { className: "hp-srow" },
      React4.createElement("div", { className: "hp-sstack" }, fmt(seat.stack)),
      seat.bet > 0 ? React4.createElement("div", { key: `bet-${seat.playerId.slice(0, 6)}-${seat.bet}`, className: "hp-sbet" }, `\u4E0B\u6CE8 ${fmt(seat.bet)}`) : null
    ),
    stateText,
    cards
  );
}

// src/client/components/PokerTable.tsx
var React5 = __toESM(require("react"), 1);
function CommunityCards(props) {
  if (props.community.length === 0) return React5.createElement(React5.Fragment, null);
  return React5.createElement(
    "div",
    { className: "hp-community" },
    props.community.map((c, i) => React5.createElement(CardView, { key: `c${props.handNumber}-${i}`, card: c, delay: i * 70 }))
  );
}
function PotDisplay(props) {
  const total = props.pots.reduce((s, p) => s + p.amount, 0);
  if (total === 0 && props.pots.length === 0) return null;
  let label = total > 0 ? `\u5E95\u6C60 ${fmt(total)}` : "\u5E95\u6C60 0";
  if (props.pots.length > 1) label += `  (${props.pots.map((p) => fmt(p.amount)).join(" + ")})`;
  return React5.createElement("div", { key: `pot-${total}`, className: "hp-pot" }, label);
}
function WaitingState(props) {
  return React5.createElement(
    "div",
    { className: "hp-waiting" },
    React5.createElement("div", { className: "hp-bigspade" }, "\u2660"),
    React5.createElement("div", { className: "hp-wtitle" }, "\u7B49\u5F85\u73A9\u5BB6\u5165\u5EA7"),
    React5.createElement("div", { className: "hp-hint" }, `${props.seated}/${props.maxSeats} \u4EBA \xB7 \u590D\u5236\u623F\u95F4 ID \u9080\u8BF7\u670B\u53CB`)
  );
}

// src/client/components/useCompact.ts
var React6 = __toESM(require("react"), 1);
function useCompact() {
  const [compact, setCompact] = React6.useState(false);
  React6.useEffect(() => {
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

// src/client/components/PokerStage.tsx
function useElementSize() {
  const ref = React7.useRef(null);
  const [size, setSize] = React7.useState({ width: NOMINAL_STAGE.w, height: NOMINAL_STAGE.h });
  React7.useEffect(() => {
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
  const compact = useCompact();
  const [stageRef, size] = useElementSize();
  const occupied = t.seats.filter((s) => s.playerId !== "");
  const viewerSeat = t.mySeat;
  const secondsLeft = t.actionDeadlineAt > 0 ? Math.max(0, Math.ceil((t.actionDeadlineAt - Date.now()) / 1e3)) : null;
  const winnerIds = new Set(t.winners.map((w) => w.playerId));
  const positions = seatPositionsPx(occupied.map((s) => s.seat), viewerSeat, false, size.width, size.height);
  const bySeat = /* @__PURE__ */ new Map();
  occupied.forEach((s, i) => {
    const p = positions[i];
    if (p !== void 0) bySeat.set(s.seat, p);
  });
  const renderSeat = (s) => {
    const pos = bySeat.get(s.seat);
    return React7.createElement(PlayerSeat, {
      key: s.playerId,
      seat: s,
      handNumber: t.handNumber,
      secondsLeft,
      deadlineMs: t.actionDeadlineAt,
      isWinner: winnerIds.has(s.playerId),
      style: pos !== void 0 && !compact ? { left: pos.left, top: pos.top } : void 0,
      className: compact ? s.isMe ? void 0 : "flow" : void 0
    });
  };
  const felt = React7.createElement(
    "div",
    { className: "hp-felt" },
    t.phase === "idle" ? React7.createElement(WaitingState, { seated: occupied.length, maxSeats: t.maxSeats }) : React7.createElement(CommunityCards, { community: t.community, handNumber: t.handNumber }),
    React7.createElement(PotDisplay, { pots: t.pots })
  );
  const opponents = occupied.filter((s) => !s.isMe);
  let body;
  if (compact) {
    body = React7.createElement(
      React7.Fragment,
      null,
      React7.createElement("div", { className: "hp-seats-row" }, opponents.map(renderSeat)),
      felt,
      occupied.filter((s) => s.isMe).map(renderSeat)
    );
  } else {
    body = React7.createElement(
      React7.Fragment,
      null,
      felt,
      occupied.map(renderSeat)
    );
  }
  const phaseLabel = { idle: "\u7B49\u5F85\u5165\u5EA7", preflop: "\u7FFB\u724C\u524D", flop: "\u7FFB\u724C", turn: "\u8F6C\u724C", river: "\u6CB3\u724C", showdown: "\u644A\u724C" }[t.phase] ?? t.phase;
  return React7.createElement(
    "div",
    { className: "hp-stage", ref: stageRef },
    React7.createElement(
      "div",
      { className: "hp-statusline" },
      React7.createElement("span", { className: "hp-phase" }, phaseLabel),
      React7.createElement("span", { className: "hp-hand" }, `Hand #${t.handNumber}`),
      React7.createElement("span", null, `${t.name}`)
    ),
    body
  );
}

// src/client/components/ActionDock.tsx
var React8 = __toESM(require("react"), 1);
function ActionDock(props) {
  const t = props.table;
  const mySeat = t.mySeat;
  const myTurn = mySeat !== null && mySeat === t.currentTurnSeat && props.connected;
  const [selectedRatio, setSelectedRatio] = React8.useState(1.25);
  const [customAmount, setCustomAmount] = React8.useState(null);
  const actions = props.spectating ? [] : t.myLegalActions ?? [];
  const callAction = actions.find((a) => a.type === "call");
  const betAction = actions.find((a) => a.type === "bet");
  const raiseAction = actions.find((a) => a.type === "raise");
  const checkAction = actions.find((a) => a.type === "check");
  const canFold = actions.some((a) => a.type === "fold");
  const canAllIn = actions.some((a) => a.type === "allin");
  const callLabel = callAction !== void 0 && callAction.amount !== void 0 ? `\u8DDF\u6CE8 ${fmt(callAction.amount)}` : checkAction !== void 0 ? "\u8FC7\u724C" : null;
  const betLabel = betAction !== void 0 ? "\u4E0B\u6CE8" : raiseAction !== void 0 ? "\u52A0\u6CE8" : null;
  const raiseBase = betAction !== void 0 ? betAction : raiseAction;
  const potTotal = t.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const occupiedSeats = t.seats.filter((seat) => seat.playerId !== "").length;
  const full = occupiedSeats >= t.maxSeats;
  const ratioAmount = (ratio) => {
    if (raiseBase === void 0) return 0;
    const min = raiseBase.min ?? 1;
    const max = raiseBase.max ?? min;
    return Math.max(min, Math.min(max, Math.round(Math.max(potTotal, t.bigBlind) * ratio)));
  };
  const selectedAmount = (() => {
    if (raiseBase === void 0) return 0;
    const min = raiseBase.min ?? 1;
    const max = raiseBase.max ?? min;
    return Math.max(min, Math.min(max, Math.round(customAmount ?? ratioAmount(selectedRatio))));
  })();
  const current = t.seats.find((s) => s.seat === t.currentTurnSeat);
  let hint;
  if (!props.connected) hint = "\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u6B63\u5728\u91CD\u8FDE\u2026";
  else if (props.spectating) hint = "\u89C2\u6218\u4E2D \xB7 \u5165\u5EA7\u540E\u5373\u53EF\u53C2\u4E0E";
  else if (t.phase === "idle") hint = "\u7B49\u5F85\u5176\u4ED6\u73A9\u5BB6\u52A0\u5165\u2026";
  else if (!myTurn) hint = `\u7B49\u5F85 ${current !== void 0 ? current.nickname : "\u5176\u4ED6\u73A9\u5BB6"} \u64CD\u4F5C\u2026`;
  else hint = "\u8F6E\u5230\u4F60\u4E86";
  if (props.spectating) {
    return React8.createElement(
      "div",
      { className: "hp-dock" },
      React8.createElement(
        "div",
        { className: "hp-actionrow" },
        React8.createElement("button", { className: "hp-action-btn call", disabled: !props.connected, onClick: () => joinTable(t.tableId, props.nickname || "Player", t.buyIn) }, "\u52A0\u5165\u724C\u684C"),
        React8.createElement("button", { className: "hp-btn ghost", onClick: stopWatching }, "\u8FD4\u56DE\u5927\u5385")
      ),
      React8.createElement("div", { className: "hp-hint" }, hint)
    );
  }
  if (t.phase === "idle") {
    return React8.createElement(
      "div",
      { className: "hp-dock" },
      React8.createElement(
        "div",
        { className: "hp-actionrow" },
        React8.createElement(
          "button",
          {
            "data-testid": "add-bot",
            className: "hp-action-btn bot primary-action",
            disabled: !props.connected || full,
            onClick: () => addBot(t.tableId)
          },
          full ? "\u724C\u684C\u5DF2\u6EE1" : "\uFF0B \u52A0\u5165 AI \u673A\u5668\u4EBA"
        )
      ),
      React8.createElement("div", { className: "hp-hint" }, full ? "\u7B49\u5F85\u724C\u5C40\u5F00\u59CB\u2026" : "\u6CA1\u6709\u771F\u4EBA\uFF1F\u6DFB\u52A0 AI \u540E\u7ACB\u5373\u5F00\u5C40")
    );
  }
  return React8.createElement(
    "div",
    { className: "hp-dock" },
    raiseBase !== void 0 ? React8.createElement(
      "div",
      { className: "hp-bet-presets" },
      [0.33, 0.5, 0.75, 1.25].map(
        (ratio) => React8.createElement(
          "button",
          {
            key: ratio,
            className: `hp-preset${customAmount === null && selectedRatio === ratio ? " selected" : ""}`,
            disabled: !myTurn,
            onClick: () => {
              setSelectedRatio(ratio);
              setCustomAmount(null);
            },
            title: `${fmt(ratioAmount(ratio))}`
          },
          `${Math.round(ratio * 100)}%`
        )
      ),
      React8.createElement("input", {
        className: "hp-preset-track",
        type: "range",
        min: raiseBase.min ?? 1,
        max: raiseBase.max ?? raiseBase.min ?? 1,
        step: 1,
        value: selectedAmount,
        disabled: !myTurn,
        "aria-label": betLabel === "\u52A0\u6CE8" ? "\u52A0\u6CE8\u91D1\u989D" : "\u4E0B\u6CE8\u91D1\u989D",
        onChange: (event) => setCustomAmount(Number(event.target.value))
      }),
      React8.createElement("span", { className: "hp-preset-value" }, fmt(selectedAmount)),
      canAllIn ? React8.createElement("button", { className: "hp-preset allin", disabled: !myTurn, onClick: () => playAction("allin") }, "\u5168\u4E0B") : null
    ) : null,
    React8.createElement(
      "div",
      { className: "hp-actionrow" },
      React8.createElement("button", { className: "hp-action-btn fold", disabled: !myTurn || !canFold, onClick: () => playAction("fold") }, "\u5F03\u724C"),
      callLabel !== null ? React8.createElement("button", { className: "hp-action-btn call", disabled: !myTurn, onClick: () => playAction(callAction !== void 0 ? "call" : "check") }, callLabel) : null,
      betLabel !== null ? React8.createElement(
        "button",
        {
          "data-testid": "primary-bet",
          className: "hp-action-btn bet primary-action",
          disabled: !myTurn,
          onClick: () => raiseBase !== void 0 && playAction(raiseBase.type, selectedAmount)
        },
        `${betLabel} ${fmt(selectedAmount)}`
      ) : React8.createElement("button", { className: "hp-action-btn allin primary-action", disabled: !myTurn || !canAllIn, onClick: () => playAction("allin") }, "\u5168\u4E0B")
    ),
    React8.createElement(
      "div",
      { className: "hp-hint hp-hint-actions" },
      React8.createElement("span", null, hint),
      React8.createElement(
        "button",
        {
          "data-testid": "add-bot-active",
          className: "hp-add-bot-inline",
          disabled: !props.connected || full,
          onClick: () => addBot(t.tableId),
          title: full ? "\u724C\u684C\u5DF2\u6EE1" : "\u673A\u5668\u4EBA\u5C06\u5728\u4E0B\u4E00\u624B\u724C\u52A0\u5165"
        },
        full ? `${occupiedSeats}/${t.maxSeats} \u5DF2\u6EE1` : `\uFF0B AI \xB7 ${occupiedSeats}/${t.maxSeats}`
      )
    )
  );
}

// src/client/components/HandHistoryDrawer.tsx
var React9 = __toESM(require("react"), 1);
function HandHistoryDrawer(props) {
  const ref = React9.useRef(null);
  React9.useEffect(() => {
    if (props.open && ref.current !== null) ref.current.scrollTop = ref.current.scrollHeight;
  }, [props.open, props.log.length]);
  if (!props.open) return null;
  return React9.createElement(
    "div",
    { className: "hp-drawer" },
    React9.createElement(
      "div",
      { className: "hp-drawer-head" },
      React9.createElement("span", null, "Hand History"),
      React9.createElement("span", { className: "hp-spacer" }),
      React9.createElement("button", { className: "hp-btn ghost", onClick: props.onClose }, "Close")
    ),
    React9.createElement(
      "div",
      { className: "hp-log", ref },
      props.log.map((entry, i) => {
        const cls = /wins|Showdown/i.test(entry.text) ? "good" : /folds|left|timeout/i.test(entry.text) ? "warn" : "";
        return React9.createElement(
          "div",
          { key: i, className: cls },
          React9.createElement("span", { className: "t" }, timeStr(entry.at)),
          entry.text
        );
      })
    )
  );
}

// src/client/components/TableView.tsx
function TableView() {
  const store = useStore();
  const t = store.table;
  const [drawerOpen, setDrawerOpen] = React10.useState(false);
  if (t === null) return null;
  const spectating = t.mySeat === null;
  const showdown = t.winners.length > 0 ? React10.createElement(
    "div",
    { className: "hp-showdown" },
    React10.createElement("span", { className: "w" }, `Hand #${t.handNumber}`),
    " \u2014 ",
    t.winners.map(
      (w, i) => React10.createElement(
        "span",
        { key: i },
        i > 0 ? ", " : null,
        React10.createElement("span", { className: "w" }, `${w.nickname} wins ${fmt(w.amount)}`),
        ` (${w.handLabel})`
      )
    ),
    t.reveal.length > 0 ? React10.createElement(
      "div",
      { style: { marginTop: 4 } },
      `Showdown: ${t.reveal.map((r) => `${r.nickname} [${r.cards.join(" ").toUpperCase()}] \u2014 ${r.handLabel}`).join(" \xB7 ")}`
    ) : null
  ) : null;
  return React10.createElement(
    React10.Fragment,
    null,
    !store.connected ? React10.createElement("div", { className: "hp-banner warn" }, React10.createElement("div", { className: "hp-dotpulse" }), "Connection lost \u2014 reconnecting\u2026") : null,
    React10.createElement(PokerStage, { table: t }),
    showdown,
    React10.createElement(ActionDock, {
      table: t,
      spectating,
      connected: store.connected,
      nickname: store.nickname
    }),
    React10.createElement(
      "div",
      { className: "hp-history-control" },
      React10.createElement("button", { className: "hp-btn hp-drawer-toggle", onClick: () => setDrawerOpen((v) => !v) }, drawerOpen ? "\u6536\u8D77\u8BB0\u5F55" : "\u724C\u5C40\u8BB0\u5F55")
    ),
    React10.createElement(HandHistoryDrawer, { open: drawerOpen, log: t.log, onClose: () => setDrawerOpen(false) })
  );
}

// src/client/components/LobbyView.tsx
var React11 = __toESM(require("react"), 1);
function LobbyView() {
  const store = useStore();
  const [nickname, setNickname] = React11.useState(store.nickname || (store.session !== null ? store.session.nickname : ""));
  const [tableName, setTableName] = React11.useState("");
  const [maxSeats, setMaxSeats] = React11.useState("6");
  const [buyIn, setBuyIn] = React11.useState("1000");
  const [joinId, setJoinId] = React11.useState("");
  const tables = store.lobby ?? [];
  const walletText = store.wallet === null ? "\u2026" : String(store.wallet).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (store.connecting) {
    return React11.createElement("div", { className: "hp-loading" }, React11.createElement("div", { className: "hp-spinner" }), React11.createElement("div", null, "Connecting to game server\u2026"));
  }
  const createPanel = React11.createElement(
    "div",
    { className: "hp-panel" },
    React11.createElement("h3", null, "Create a table"),
    React11.createElement(
      "div",
      { className: "hp-field" },
      React11.createElement("label", null, "Your nickname"),
      React11.createElement("input", { "data-testid": "nickname", className: "hp-input", value: nickname, maxLength: 20, onChange: (e) => setNickname(e.target.value) })
    ),
    React11.createElement(
      "div",
      { className: "hp-row" },
      React11.createElement(
        "div",
        { className: "hp-field", style: { flex: 1 } },
        React11.createElement("label", null, "Table name"),
        React11.createElement("input", { "data-testid": "table-name", className: "hp-input", value: tableName, maxLength: 40, placeholder: "Friday Night", onChange: (e) => setTableName(e.target.value) })
      ),
      React11.createElement(
        "div",
        { className: "hp-field", style: { width: 88 } },
        React11.createElement("label", null, "Seats"),
        React11.createElement(
          "select",
          { className: "hp-input", value: maxSeats, onChange: (e) => setMaxSeats(e.target.value) },
          ["2", "3", "4", "5", "6"].map((n) => React11.createElement("option", { key: n, value: n }, n))
        )
      )
    ),
    React11.createElement(
      "button",
      {
        className: "hp-btn primary",
        disabled: !store.connected || nickname.trim() === "",
        onClick: () => {
          Store.set({ nickname: nickname.trim() });
          createTable(tableName.trim() || `Poker ${maxSeats}p`, Number(maxSeats));
        }
      },
      "Create table"
    )
  );
  const listPanel = tables.length === 0 ? React11.createElement(
    "div",
    { className: "hp-panel" },
    React11.createElement("h3", null, "Open tables"),
    React11.createElement(
      "div",
      { className: "hp-empty" },
      React11.createElement("div", { className: "hp-bigspade" }, "\u2660"),
      React11.createElement("div", null, "No tables yet"),
      React11.createElement("div", { className: "hp-hint" }, "Create one, or ask a friend for a room ID to join by ID.")
    )
  ) : React11.createElement(
    "div",
    { className: "hp-panel" },
    React11.createElement("h3", null, "Open tables"),
    React11.createElement(
      "div",
      { className: "hp-tablelist" },
      tables.map((t) => {
        const full = t.playerCount >= t.maxSeats;
        return React11.createElement(
          "div",
          { key: t.tableId, className: "hp-table-item" },
          React11.createElement(
            "div",
            { className: "hp-tinfo" },
            React11.createElement("div", { className: "hp-tname" }, t.name),
            React11.createElement("div", { className: "hp-tmeta" }, `${t.playerCount}/${t.maxSeats} players \xB7 blinds ${t.smallBlind}/${t.bigBlind} \xB7 buy-in ${t.buyIn}`),
            React11.createElement("div", { className: "hp-tmeta" }, `Room: ${t.tableId}`)
          ),
          React11.createElement("span", { className: `hp-badge ${t.status === "playing" ? "live" : "wait"}` }, t.status === "playing" ? "playing" : "waiting"),
          full ? React11.createElement("button", { className: "hp-btn", disabled: !store.connected, onClick: () => watchTable(t.tableId) }, "Watch") : React11.createElement(
            "button",
            {
              "data-testid": `join-${t.tableId}`,
              className: "hp-btn primary",
              disabled: !store.connected || nickname.trim() === "",
              onClick: () => {
                Store.set({ nickname: nickname.trim() });
                joinTable(t.tableId, nickname.trim() || "Player", Number(buyIn) > 0 ? Number(buyIn) : t.buyIn);
              }
            },
            "Join"
          )
        );
      })
    )
  );
  return React11.createElement(
    "div",
    { className: "hp-lobby" },
    React11.createElement(
      "div",
      { className: "hp-wallet" },
      "Play Tokens: ",
      React11.createElement("b", null, walletText),
      " \xB7 blinds 5/10 \xB7 default buy-in 1000"
    ),
    React11.createElement("div", { className: "hp-lobby-grid" }, createPanel, listPanel),
    React11.createElement(
      "div",
      { className: "hp-panel" },
      React11.createElement("h3", null, "Join by room ID"),
      React11.createElement(
        "div",
        { className: "hp-row" },
        React11.createElement("input", { "data-testid": "join-id", className: "hp-input", style: { flex: 1, minWidth: 140 }, value: joinId, placeholder: "paste a room ID", onChange: (e) => setJoinId(e.target.value) }),
        React11.createElement(
          "button",
          {
            className: "hp-btn primary",
            disabled: !store.connected || joinId.trim() === "" || nickname.trim() === "",
            onClick: () => {
              const id = joinId.trim();
              const meta = tables.find((t) => t.tableId === id);
              Store.set({ nickname: nickname.trim() });
              joinTable(id, nickname.trim() || "Player", meta !== void 0 ? meta.buyIn : 1e3);
            }
          },
          "Join"
        )
      ),
      React11.createElement(
        "div",
        { className: "hp-field" },
        React11.createElement("label", null, "Buy-in chips (per table)"),
        React11.createElement("input", { className: "hp-input", type: "number", min: 1, value: buyIn, onChange: (e) => setBuyIn(e.target.value) })
      )
    ),
    React11.createElement("div", { className: "hp-err" }, store.error !== null ? store.error : " ")
  );
}

// src/client/components/PokerOverlay.tsx
function PokerOverlay() {
  const store = useStore();
  if (!store.open) return null;
  const t = store.table;
  const inTable = t !== null && store.session !== null && t.tableId === store.session.tableId;
  const watching = t !== null && !inTable && t.tableId === store.spectateTableId;
  const showTable = inTable || watching;
  const showTableLoading = store.spectateTableId !== null && store.table === null;
  let body;
  if (showTableLoading) {
    body = React12.createElement(Spinner, { label: "Loading table\u2026" });
  } else if (showTable && t !== null) {
    body = React12.createElement(TableView, null);
  } else {
    body = React12.createElement(LobbyView, null);
  }
  return React12.createElement(
    "div",
    { className: "hp-root" },
    store.error !== null ? React12.createElement("div", { className: "hp-toast" }, store.error) : null,
    React12.createElement(PokerHeader, null),
    React12.createElement("div", { className: "hp-body" }, body)
  );
}

// src/client/components/SidebarButton.tsx
var React13 = __toESM(require("react"), 1);
function PokerCenterButton(props) {
  const store = useStore();
  const wide = props.wide !== false;
  return React13.createElement(
    "button",
    {
      className: "hp-sidebar-btn" + (store.open ? " active" : ""),
      title: "Game Center (Poker)",
      onClick: () => {
        const next = !store.open;
        Store.set({ open: next, error: null });
        if (next) connect();
      }
    },
    React13.createElement("span", { className: "spade" }, "\u2660"),
    wide ? React13.createElement("span", { className: "plabel" }, "Poker") : null,
    wide ? React13.createElement("span", { className: "hp-statusdot " + (store.connected ? "on" : "off") }) : null
  );
}

// src/client/plugin.ts
var name = "dsh-poker";
var inject = ["slots"];
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  slots.inject(
    "sidebar.footer.action",
    () => slots.register(
      { name: "sidebar.footer.action", id: "poker-center", order: 30, label: "Poker" },
      (slotProps) => React14.createElement(PokerCenterButton, { wide: slotProps.wide !== false })
    )
  );
  slots.inject(
    "shell.overlay",
    () => slots.register({ name: "shell.overlay", id: "poker-table", order: 40 }, () => React14.createElement(PokerOverlay, null))
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
  handleMessage: () => handleMessage,
  joinTable: () => joinTable,
  leaveTable: () => leaveTable,
  playAction: () => playAction,
  rid: () => rid,
  seatBoxes: () => seatBoxes,
  seatPositions: () => seatPositions,
  seatPositionsPx: () => seatPositionsPx,
  send: () => send,
  stopWatching: () => stopWatching,
  watchTable: () => watchTable
});

// src/client/poker.css
var poker_default = '/* dsh-poker \u2014 game-area theme & layout (UI v3).\n *\n * The game area uses ONLY the --hp-* tokens below, hard-coded dark values.\n * DSH light-theme tokens (--dsw-alias-*) are never consulted inside the game\n * area, so the poker surface can never flip to white or lose contrast. DSH\n * tokens appear only on the sidebar entry button (the integration point).\n */\n\n/* \u2500\u2500 theme tokens \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-root {\n  --hp-bg: #0a0f16;\n  --hp-bg-2: #0e141d;\n  --hp-surface: #131b26;\n  --hp-surface-2: #1a2432;\n  --hp-surface-3: #223048;\n  --hp-border: #2a3850;\n  --hp-border-soft: rgba(122, 145, 180, 0.22);\n  --hp-text: #e9eef6;\n  --hp-muted: #a4b1c2;\n  --hp-accent: #e8b339;\n  --hp-accent-strong: #f5c95c;\n  --hp-good: #4fc07f;\n  --hp-bad: #e2605a;\n  --hp-violet: #a98ef0;\n  --hp-felt: #0c3829;\n  --hp-felt-hi: #11503a;\n  --hp-felt-edge: #072219;\n  --hp-felt-rim: #4a3319;\n  --hp-seat-bg: rgba(13, 20, 30, 0.86);\n  --hp-seat-border: rgba(148, 170, 202, 0.32);\n  --hp-focus: #5b9cf0;\n}\n\n/* \u2500\u2500 shell \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-root {\n  position: fixed;\n  inset: 0;\n  z-index: 2147483000;\n  display: flex;\n  flex-direction: column;\n  background: var(--hp-bg);\n  color: var(--hp-text);\n  font-family: var(--dsh-font-family, system-ui, -apple-system, "Segoe UI", sans-serif);\n  overflow: hidden;\n  pointer-events: auto;\n  font-size: 14px;\n  line-height: 1.45;\n}\n.hp-root,\n.hp-root * {\n  box-sizing: border-box;\n}\n\n/* \u2500\u2500 compact room bar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-roombar {\n  flex: none;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 8px 16px;\n  background: var(--hp-bg-2);\n  border-bottom: 1px solid var(--hp-border);\n  min-height: 44px;\n}\n.hp-roombar .hp-brand {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 14px;\n  font-weight: 650;\n  letter-spacing: 0.02em;\n  white-space: nowrap;\n}\n.hp-roombar .hp-spade { color: var(--hp-accent); font-size: 16px; }\n.hp-roombar .hp-table-meta {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n  color: var(--hp-muted);\n  font-size: 12.5px;\n}\n.hp-roombar .hp-table-meta .hp-tname { color: var(--hp-text); font-weight: 600; }\n.hp-roombar .hp-table-meta .hp-roomid {\n  font-family: ui-monospace, Menlo, monospace;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  max-width: 220px;\n}\n.hp-roombar .hp-spacer { flex: 1; }\n.hp-roombar .hp-conn { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--hp-muted); }\n.hp-roombar .hp-conn .hp-dotpulse { width: 8px; height: 8px; border-radius: 50%; background: var(--hp-accent); animation: hp-pulse 1.4s ease-in-out infinite; flex: none; }\n\n/* \u2500\u2500 buttons / inputs (game area) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-btn {\n  background: var(--hp-surface-2);\n  border: 1px solid var(--hp-border);\n  color: var(--hp-text);\n  border-radius: 9px;\n  padding: 7px 13px;\n  font-size: 13px;\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  transition: filter 0.12s, background 0.12s, border-color 0.12s;\n  white-space: nowrap;\n}\n.hp-btn:hover { filter: brightness(1.2); border-color: var(--hp-border-soft); }\n.hp-btn:focus-visible { outline: 2px solid var(--hp-focus); outline-offset: 2px; }\n.hp-btn.primary { background: #1d5c43; border-color: #2f8a63; color: #eafff4; }\n.hp-btn.danger { background: rgba(150, 55, 48, 0.25); border-color: #a13d39; color: #ffb0ab; }\n.hp-btn.ghost { background: transparent; border-color: transparent; }\n.hp-btn:disabled { opacity: 0.45; cursor: not-allowed; filter: none; }\n.hp-input {\n  background: var(--hp-bg-2);\n  border: 1px solid var(--hp-border);\n  color: var(--hp-text);\n  border-radius: 8px;\n  padding: 7px 10px;\n  font-size: 13px;\n  outline: none;\n  transition: border-color 0.12s;\n}\n.hp-input:focus { border-color: var(--hp-focus); }\n.hp-hint { font-size: 12.5px; color: var(--hp-muted); line-height: 1.5; }\n.hp-err { color: var(--hp-bad); font-size: 13px; min-height: 18px; }\n\n/* \u2500\u2500 overlay body / banners / toast / spinner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-body {\n  flex: 1;\n  min-height: 0;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  padding: 0;\n  gap: 0;\n  overflow: hidden;\n}\n.hp-toast {\n  position: absolute;\n  top: 54px;\n  left: 50%;\n  transform: translateX(-50%);\n  background: var(--hp-surface-2);\n  border: 1px solid #a13d39;\n  color: #ffb0ab;\n  padding: 8px 14px;\n  border-radius: 10px;\n  font-size: 13px;\n  z-index: 6;\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);\n  animation: hp-slide-down 0.18s ease-out;\n}\n.hp-banner {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 7px 12px;\n  border-radius: 9px;\n  font-size: 12.5px;\n  border: 1px solid var(--hp-border);\n  background: var(--hp-surface);\n  color: var(--hp-muted);\n}\n.hp-banner.warn { color: #e8c66a; border-color: #6d5617; background: rgba(232, 198, 106, 0.08); }\n.hp-spinner { width: 26px; height: 26px; border: 3px solid var(--hp-border); border-top-color: var(--hp-accent); border-radius: 50%; animation: hp-spin 0.8s linear infinite; margin: 0 auto; }\n.hp-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 0; color: var(--hp-muted); font-size: 13px; }\n\n/* \u2500\u2500 stage \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-stage {\n  position: relative;\n  flex: 1;\n  width: 100%;\n  min-height: 0;\n  overflow: hidden;\n  padding: 0 12px;\n}\n.hp-statusline {\n  position: absolute;\n  top: 0;\n  left: 50%;\n  transform: translateX(-50%);\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 4px 14px;\n  border-radius: 0 0 10px 10px;\n  background: var(--hp-bg-2);\n  border: 1px solid var(--hp-border);\n  border-top: none;\n  font-size: 12px;\n  color: var(--hp-muted);\n  white-space: nowrap;\n  z-index: 3;\n}\n.hp-statusline .hp-phase { color: var(--hp-text); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }\n.hp-statusline .hp-hand { font-variant-numeric: tabular-nums; }\n\n/* the table */\n.hp-felt {\n  position: absolute;\n  top: 52%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  width: 56%;\n  aspect-ratio: 16 / 9;\n  border-radius: 999px;\n  background: radial-gradient(ellipse at center, var(--hp-felt-hi) 0%, var(--hp-felt) 58%, var(--hp-felt-edge) 100%);\n  border: 5px solid var(--hp-felt-rim);\n  box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.45), 0 6px 22px rgba(0, 0, 0, 0.4);\n}\n.hp-community {\n  position: absolute;\n  top: 38%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  display: flex;\n  gap: 6px;\n  align-items: center;\n}\n.hp-pot {\n  position: absolute;\n  top: 66%;\n  left: 50%;\n  transform: translateX(-50%);\n  font-size: 12.5px;\n  color: #ffe9b3;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 3px 12px;\n  border-radius: 999px;\n  white-space: nowrap;\n  font-variant-numeric: tabular-nums;\n}\n.hp-waiting {\n  position: absolute;\n  top: 42%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n  color: #d7ecdf;\n  text-align: center;\n  width: min(340px, 70%);\n}\n.hp-waiting .hp-bigspade { font-size: 30px; color: var(--hp-accent); opacity: 0.75; line-height: 1; }\n.hp-waiting .hp-wtitle { font-size: 14px; font-weight: 600; }\n.hp-waiting .hp-hint { color: #b7d3c3; }\n\n/* playing cards */\n.hp-card {\n  position: relative;\n  width: 52px;\n  height: 72px;\n  border-radius: 8px;\n  background: #f4f2ec;\n  color: #1a1a1a;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  padding: 4px 5px;\n  font-size: 14px;\n  font-weight: 700;\n  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.45);\n  line-height: 1;\n  animation: hp-deal-in 0.24s ease-out both;\n}\n.hp-card .r { line-height: 1; font-variant-numeric: tabular-nums; }\n.hp-card .s { font-size: 17px; line-height: 1; }\n.hp-card.red { color: #c62828; }\n.hp-card.back { background: repeating-linear-gradient(45deg, #1f4a8a, #1f4a8a 6px, #2a5ba0 6px, #2a5ba0 12px); border: 2px solid #16356b; animation: none; }\n.hp-card.small { width: 34px; height: 47px; font-size: 12px; border-radius: 5px; }\n.hp-card.small .s { font-size: 13px; }\n.hp-card.mini { width: 26px; height: 36px; font-size: 10px; border-radius: 4px; padding: 2px 3px; }\n.hp-card.mini .s { font-size: 11px; }\n\n/* \u2500\u2500 player seat cards (desktop: absolute; mobile: flow) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-seat {\n  position: absolute;\n  width: 172px;\n  min-height: 122px;\n  transform: translate(-50%, -50%);\n  background: var(--hp-seat-bg);\n  border: 1px solid var(--hp-seat-border);\n  border-radius: 12px;\n  padding: 8px 10px 7px;\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);\n  backdrop-filter: blur(2px);\n  transition: border-color 0.18s, box-shadow 0.18s;\n}\n.hp-seat .hp-seat-head { display: flex; align-items: center; gap: 8px; min-width: 0; }\n.hp-seat .hp-avatar {\n  width: 34px;\n  height: 34px;\n  border-radius: 50%;\n  flex: none;\n  background: #223448;\n  border: 2px solid var(--hp-seat-border);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 15px;\n  font-weight: 700;\n  color: #d8e6f5;\n  position: relative;\n}\n.hp-seat .hp-sname {\n  font-size: 13px;\n  font-weight: 650;\n  color: var(--hp-text);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: 1;\n  min-width: 0;\n}\n.hp-seat .hp-sstack { font-size: 12.5px; color: var(--hp-accent); font-variant-numeric: tabular-nums; }\n.hp-seat .hp-srow { display: flex; align-items: center; gap: 8px; min-height: 19px; }\n.hp-seat .hp-sbet {\n  font-size: 11.5px;\n  color: #fff;\n  background: rgba(0, 0, 0, 0.55);\n  border: 1px solid rgba(255, 255, 255, 0.16);\n  padding: 1px 8px;\n  border-radius: 999px;\n  animation: hp-bet-pop 0.26s ease-out;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n.hp-seat .hp-sstate { font-size: 11px; color: #ff9d97; letter-spacing: 0.06em; }\n.hp-seat .hp-sstate.allin { color: var(--hp-violet); }\n.hp-seat .hp-cards { display: flex; gap: 4px; min-height: 47px; align-items: flex-end; margin-top: 2px; }\n.hp-seat .hp-dbtn {\n  position: absolute;\n  top: -9px;\n  right: -7px;\n  background: #d9d9d9;\n  color: #111;\n  font-size: 11px;\n  font-weight: 800;\n  width: 20px;\n  height: 20px;\n  border-radius: 50%;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border: 2px solid #111;\n}\n.hp-seat .hp-blind {\n  position: absolute;\n  top: -9px;\n  left: -7px;\n  background: #6d5617;\n  color: #ffe9b3;\n  font-size: 10.5px;\n  font-weight: 700;\n  padding: 1px 6px;\n  border-radius: 999px;\n}\n.hp-seat .hp-count { font-size: 11.5px; color: var(--hp-good); font-variant-numeric: tabular-nums; }\n.hp-seat .hp-dot {\n  width: 9px;\n  height: 9px;\n  border-radius: 50%;\n  background: var(--hp-good);\n  position: absolute;\n  bottom: -1px;\n  right: -1px;\n  border: 2px solid #0d1520;\n}\n.hp-seat .hp-dot.off { background: #8a8f98; }\n.hp-seat.me { border-color: rgba(232, 179, 57, 0.65); box-shadow: 0 0 14px rgba(232, 179, 57, 0.25), 0 4px 14px rgba(0, 0, 0, 0.35); }\n.hp-seat.turn { border-color: rgba(79, 192, 127, 0.8); animation: hp-turn-pulse 1.7s ease-in-out infinite; }\n.hp-seat.winner { border-color: var(--hp-accent); animation: hp-win-glow 1.3s ease-out 2; }\n.hp-seat.folded { opacity: 0.6; }\n.hp-seat.folded .hp-cards { animation: hp-fold-fade 0.32s ease-in forwards; }\n\n/* \u2500\u2500 action dock \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-dock {\n  flex: none;\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  background: var(--hp-bg-2);\n  border-top: 1px solid var(--hp-border);\n  padding: 10px 16px 12px;\n  margin-top: 16px;\n}\n.hp-dock .hp-actionrow { display: flex; gap: 10px; align-items: stretch; }\n.hp-action-btn {\n  flex: 1;\n  min-width: 108px;\n  padding: 10px 12px;\n  border-radius: 9px;\n  border: 1px solid rgba(255, 255, 255, 0.14);\n  font-size: 13.5px;\n  font-weight: 650;\n  cursor: pointer;\n  color: #fff;\n  transition: filter 0.12s, transform 0.06s;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  min-height: 42px;\n}\n.hp-action-btn:active:not(:disabled) { transform: translateY(1px); }\n.hp-action-btn:focus-visible { outline: 2px solid var(--hp-focus); outline-offset: 2px; }\n.hp-action-btn:disabled { opacity: 0.42; cursor: not-allowed; filter: none; }\n.hp-action-btn.fold { background: #64241f; border-color: #a13d39; color: #ffd7d4; }\n.hp-action-btn.call { background: #1d5c43; border-color: #2f8a63; color: #eafff4; }\n.hp-action-btn.bet { background: #6d5617; border-color: #a9872a; color: #fff3d6; }\n.hp-action-btn.allin { background: #3c2f66; border-color: #7a63c4; color: #ece6ff; }\n.hp-dock .hp-hint { min-height: 18px; }\n.hp-raise {\n  display: flex;\n  gap: 10px;\n  align-items: center;\n  flex-wrap: wrap;\n  background: var(--hp-surface);\n  border: 1px solid var(--hp-border);\n  border-radius: 9px;\n  padding: 9px 10px;\n  font-size: 13px;\n}\n.hp-raise input[type="range"] { flex: 1; min-width: 140px; accent-color: var(--hp-accent); }\n.hp-raise input[type="number"] {\n  width: 96px;\n  background: var(--hp-bg-2);\n  border: 1px solid var(--hp-border);\n  color: var(--hp-text);\n  border-radius: 7px;\n  padding: 6px 8px;\n  font-size: 13px;\n  font-variant-numeric: tabular-nums;\n}\n.hp-raise .hp-minmax { font-size: 11.5px; color: var(--hp-muted); font-family: ui-monospace, Menlo, monospace; font-variant-numeric: tabular-nums; }\n\n/* \u2500\u2500 hand history drawer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-drawer-toggle { flex: none; }\n.hp-history-control {\n  position: absolute;\n  top: 52px;\n  right: 12px;\n  z-index: 6;\n}\n.hp-drawer {\n  position: absolute;\n  top: 52px;\n  right: 12px;\n  bottom: 12px;\n  width: min(340px, calc(100vw - 24px));\n  background: var(--hp-surface);\n  border: 1px solid var(--hp-border);\n  border-radius: 12px;\n  display: flex;\n  flex-direction: column;\n  z-index: 5;\n  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.5);\n  animation: hp-slide-left 0.2s ease-out;\n  overflow: hidden;\n}\n.hp-drawer .hp-drawer-head {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 10px 12px;\n  border-bottom: 1px solid var(--hp-border);\n  font-size: 13px;\n  font-weight: 650;\n  flex: none;\n}\n.hp-drawer .hp-drawer-head .hp-spacer { flex: 1; }\n.hp-log { flex: 1; overflow: auto; padding: 8px 11px; font-size: 12px; line-height: 1.6; color: #c9d4e0; }\n.hp-log .t { color: #7d8a99; font-family: ui-monospace, Menlo, monospace; margin-right: 6px; font-variant-numeric: tabular-nums; }\n.hp-log .warn { color: #e8c66a; }\n.hp-log .good { color: #7ee2a8; }\n\n/* \u2500\u2500 showdown banner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-showdown {\n  flex: none;\n  margin: 0 auto;\n  width: min(720px, calc(100% - 24px));\n  padding: 9px 13px;\n  border: 1px solid #a9872a;\n  border-radius: 10px;\n  background: rgba(232, 179, 57, 0.1);\n  font-size: 13px;\n  line-height: 1.6;\n  animation: hp-slide-up 0.3s ease-out;\n  max-height: 96px;\n  overflow: auto;\n}\n.hp-showdown .w { color: #ffe9b3; font-weight: 650; }\n\n/* \u2500\u2500 lobby \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-lobby {\n  width: min(720px, 100%);\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  padding: 18px 16px 24px;\n  overflow: auto;\n  height: 100%;\n}\n.hp-wallet {\n  display: flex;\n  gap: 10px;\n  align-items: center;\n  font-size: 13px;\n  color: var(--hp-muted);\n  padding: 10px 14px;\n  border: 1px solid var(--hp-border);\n  border-radius: 10px;\n  background: var(--hp-surface);\n}\n.hp-wallet b { color: var(--hp-accent); font-variant-numeric: tabular-nums; }\n.hp-lobby-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }\n.hp-panel {\n  background: var(--hp-surface);\n  border: 1px solid var(--hp-border);\n  border-radius: 12px;\n  padding: 14px;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n.hp-panel h3 { margin: 0 0 2px; font-size: 13px; font-weight: 650; color: var(--hp-muted); letter-spacing: 0.02em; }\n.hp-field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--hp-muted); }\n.hp-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }\n.hp-tablelist { display: flex; flex-direction: column; gap: 8px; max-height: 46vh; overflow: auto; }\n.hp-table-item {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 10px 12px;\n  background: var(--hp-bg-2);\n  border: 1px solid var(--hp-border);\n  border-radius: 10px;\n  transition: border-color 0.12s;\n}\n.hp-table-item:hover { border-color: var(--hp-border-soft); }\n.hp-table-item .hp-tinfo { flex: 1; min-width: 0; }\n.hp-table-item .hp-tname { font-size: 14px; font-weight: 650; color: var(--hp-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.hp-table-item .hp-tmeta { font-size: 12px; color: var(--hp-muted); margin-top: 2px; }\n.hp-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--hp-border); color: var(--hp-muted); flex: none; }\n.hp-badge.live { color: #7ee2a8; border-color: #2f8a63; }\n.hp-badge.wait { color: #e8c66a; border-color: #6d5617; }\n.hp-empty {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 10px;\n  padding: 26px 14px;\n  color: var(--hp-muted);\n  text-align: center;\n  border: 1px dashed var(--hp-border);\n  border-radius: 12px;\n}\n.hp-empty .hp-bigspade { font-size: 34px; color: var(--hp-accent); opacity: 0.7; line-height: 1; }\n\n/* \u2500\u2500 sidebar entry (DSH integration point \u2014 may follow the app theme) \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-sidebar-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  background: transparent;\n  border: none;\n  color: var(--dsw-alias-label-secondary, #9aa4b2);\n  cursor: pointer;\n  font-size: 13px;\n  padding: 4px 6px;\n  border-radius: 8px;\n  width: 100%;\n  transition: color 0.12s, background 0.12s;\n}\n.hp-sidebar-btn:hover, .hp-sidebar-btn.active { color: var(--dsw-alias-label-primary, #e6edf3); background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06)); }\n.hp-sidebar-btn .spade { color: #e8b339; font-size: 15px; flex: none; }\n.hp-sidebar-btn .plabel { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.hp-sidebar-btn .hp-statusdot { width: 7px; height: 7px; border-radius: 50%; margin-left: auto; flex: none; }\n.hp-sidebar-btn .hp-statusdot.on { background: #57d98a; }\n.hp-sidebar-btn .hp-statusdot.off { background: #8a8f98; }\n\n/* \u2500\u2500 animations (restrained; disabled under reduced motion) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n@keyframes hp-deal-in { from { opacity: 0; transform: translateY(10px) scale(0.94); } to { opacity: 1; transform: none; } }\n@keyframes hp-bet-pop { 0% { transform: scale(0.82); } 55% { transform: scale(1.12); } 100% { transform: scale(1); } }\n@keyframes hp-fold-fade { to { opacity: 0; transform: translateY(-4px) scale(0.9); } }\n@keyframes hp-win-glow { 0%, 100% { box-shadow: 0 0 12px rgba(232, 179, 57, 0.45); } 50% { box-shadow: 0 0 26px rgba(232, 179, 57, 0.9); } }\n@keyframes hp-turn-pulse { 0%, 100% { box-shadow: 0 0 6px rgba(79, 192, 127, 0.4); } 50% { box-shadow: 0 0 18px rgba(79, 192, 127, 0.85); } }\n@keyframes hp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }\n@keyframes hp-spin { to { transform: rotate(360deg); } }\n@keyframes hp-slide-down { from { opacity: 0; transform: translate(-50%, -6px); } to { opacity: 1; transform: translate(-50%, 0); } }\n@keyframes hp-slide-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }\n@keyframes hp-slide-left { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }\n\n/* \u2500\u2500 tablet (641\u20131024px) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n@media (max-width:1024px) {\n  .hp-felt { width: 62%; }\n  .hp-seat { width: 160px; min-height: 114px; }\n  .hp-dock .hp-actionrow { gap: 8px; }\n  .hp-action-btn { min-width: 96px; }\n}\n\n/* \u2500\u2500 mobile (\u2264640px): flow layout; restructure, never shrink fonts to fit \u2500\u2500 */\n@media (max-width:640px) {\n  .hp-root { font-size: 14px; }\n  .hp-roombar { padding: 6px 10px; gap: 8px; flex-wrap: wrap; }\n  .hp-roombar .hp-table-meta { width: 100%; order: 5; padding-right: 82px; }\n  .hp-roombar .hp-table-meta .hp-tname { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n  .hp-roombar .hp-table-meta .hp-roomid { display: none; }\n  .hp-roombar .hp-table-meta .hp-btn { padding-inline: 9px; }\n  .hp-history-control { top: 52px; right: 10px; }\n  .hp-stage { overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; align-items: center; gap: 10px; }\n  .hp-statusline { position: static; transform: none; width: 100%; justify-content: center; border-radius: 10px; border: 1px solid var(--hp-border); }\n  .hp-felt { position: static; transform: none; width: 62%; aspect-ratio: 4 / 3; border-width: 4px; order: 3; margin: 4px 0; }\n  .hp-community { top: 42%; gap: 4px; }\n  .hp-card { width: 42px; height: 58px; font-size: 12px; border-radius: 6px; }\n  .hp-card .s { font-size: 14px; }\n  .hp-card.small { width: 30px; height: 41px; font-size: 11px; }\n  .hp-card.small .s { font-size: 12px; }\n  .hp-seat { position: static; transform: none; width: 47%; min-height: 0; padding: 7px 9px; border-radius: 10px; }\n  .hp-seat .hp-cards { min-height: 41px; }\n  .hp-seats-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; width: 100%; }\n  .hp-seat.me { order: 10; width: 70%; }\n  .hp-dock { padding: 8px 10px 10px; margin-top: 10px; }\n  .hp-dock .hp-actionrow { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n  .hp-action-btn { min-width: 0; min-height: 46px; font-size: 13px; padding: 10px 6px; }\n  .hp-raise { flex-direction: column; align-items: stretch; }\n  .hp-raise input[type="number"] { width: 100%; }\n  .hp-drawer { top: 60px; right: 8px; bottom: 8px; width: min(320px, calc(100vw - 16px)); }\n  .hp-showdown { font-size: 12.5px; max-height: 88px; }\n  .hp-lobby { padding: 12px 10px 20px; }\n  .hp-lobby-grid { grid-template-columns: 1fr; }\n}\n\n@media (prefers-reduced-motion:reduce) {\n  .hp-root * { animation: none !important; transition: none !important; }\n}\n\n/* \u2500\u2500 reference skin: DeepSeek Harness light game-center aesthetic \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\n.hp-root {\n  --hp-bg: #fafaf8;\n  --hp-bg-2: rgba(255, 255, 255, 0.92);\n  --hp-surface: #ffffff;\n  --hp-surface-2: #f5f5f2;\n  --hp-surface-3: #ececea;\n  --hp-border: #e6e6e2;\n  --hp-border-soft: #d8d8d3;\n  --hp-text: #151515;\n  --hp-muted: #898985;\n  --hp-accent: #2475eb;\n  --hp-accent-strong: #0e63df;\n  --hp-good: #20a464;\n  --hp-bad: #d6534d;\n  --hp-violet: #7059c9;\n  --hp-felt: #efefec;\n  --hp-felt-hi: #f4f4f1;\n  --hp-felt-edge: #e8e8e4;\n  --hp-felt-rim: transparent;\n  --hp-seat-bg: transparent;\n  --hp-seat-border: transparent;\n  --hp-focus: #2475eb;\n  background:\n    radial-gradient(circle at 50% 34%, rgba(255, 255, 255, 0.96), transparent 44%),\n    #fafaf8;\n  color: var(--hp-text);\n}\n\n.hp-roombar {\n  min-height: 48px;\n  padding: 7px 18px;\n  background: rgba(255, 255, 255, 0.94);\n  border-bottom: 1px solid #ecece8;\n  box-shadow: 0 1px 0 rgba(20, 20, 20, 0.02);\n}\n.hp-roombar .hp-brand { color: #1a1a1a; font-weight: 620; }\n.hp-roombar .hp-spade { color: #111; font-size: 14px; }\n.hp-roombar .hp-crumb { color: #9b9b96; font-weight: 450; }\n.hp-roombar .hp-table-meta { color: #a0a09b; }\n.hp-roombar .hp-table-meta .hp-tname { color: #555550; font-weight: 500; }\n.hp-roombar .hp-table-meta .hp-roomid { color: #b0b0aa; }\n\n.hp-btn {\n  color: #252525;\n  background: #fff;\n  border-color: #e2e2de;\n  border-radius: 999px;\n  box-shadow: 0 1px 2px rgba(20, 20, 20, 0.03);\n}\n.hp-btn:hover { background: #f6f6f3; border-color: #d2d2cd; filter: none; }\n.hp-btn.primary { color: #fff; background: #171717; border-color: #171717; }\n.hp-btn.danger { color: #5e5e59; background: #fff; border-color: #deded9; }\n.hp-btn.ghost { background: transparent; box-shadow: none; }\n.hp-input {\n  color: #202020;\n  background: #fff;\n  border-color: #dfdfda;\n  box-shadow: inset 0 1px 1px rgba(20, 20, 20, 0.02);\n}\n.hp-hint { color: #969691; }\n\n.hp-body { background: transparent; }\n.hp-stage { padding-inline: 20px; }\n.hp-statusline {\n  top: 10px;\n  padding: 5px 13px;\n  color: #9b9b96;\n  background: rgba(255, 255, 255, 0.88);\n  border: 1px solid #ecece7;\n  border-radius: 999px;\n  box-shadow: 0 3px 12px rgba(20, 20, 20, 0.035);\n}\n.hp-statusline .hp-phase { color: #4b4b47; font-weight: 620; letter-spacing: 0.04em; }\n\n.hp-felt {\n  top: 52%;\n  width: 59%;\n  aspect-ratio: 1.78 / 1;\n  border: 0;\n  border-radius: 44% 44% 40% 40% / 45% 45% 42% 42%;\n  background:\n    radial-gradient(ellipse at 50% 34%, rgba(255, 255, 255, 0.7), transparent 54%),\n    linear-gradient(160deg, #f2f2ef, #ebebe7);\n  box-shadow: inset 0 1px 0 #fff, 0 10px 28px rgba(25, 25, 25, 0.025);\n}\n.hp-felt::after {\n  content: "";\n  position: absolute;\n  inset: 18% 22%;\n  border-radius: 999px;\n  background: radial-gradient(ellipse, rgba(255,255,255,.42), transparent 68%);\n  pointer-events: none;\n}\n.hp-community { top: 48%; gap: 7px; z-index: 1; }\n.hp-pot {\n  top: 69%;\n  z-index: 1;\n  color: #666661;\n  background: rgba(255, 255, 255, 0.86);\n  border: 1px solid #e2e2dd;\n  padding: 4px 10px 4px 26px;\n  box-shadow: 0 2px 8px rgba(20,20,20,.04);\n}\n.hp-pot::before {\n  content: "";\n  position: absolute;\n  left: 8px;\n  top: 50%;\n  width: 11px;\n  height: 11px;\n  border-radius: 50%;\n  transform: translateY(-50%);\n  background: #2879e8;\n  box-shadow: inset 0 0 0 3px rgba(255,255,255,.46), 0 1px 2px rgba(25,75,150,.25);\n}\n.hp-waiting { color: #555550; }\n.hp-waiting .hp-bigspade { color: #111; opacity: .85; }\n.hp-waiting .hp-hint { color: #999994; }\n\n.hp-card {\n  width: 40px;\n  height: 56px;\n  padding: 4px 5px;\n  color: #171717;\n  background: #fff;\n  border: 1px solid #dededa;\n  border-radius: 5px;\n  box-shadow: 0 2px 7px rgba(20, 20, 20, 0.09);\n  font-size: 13px;\n}\n.hp-card.red { color: #e04842; }\n.hp-card.back {\n  position: relative;\n  background: #fff;\n  border: 1px solid #dededa;\n  box-shadow: 0 2px 6px rgba(20,20,20,.08);\n}\n.hp-card.back::after {\n  content: "\u2660";\n  position: absolute;\n  inset: 0;\n  display: grid;\n  place-items: center;\n  color: #1b1b1b;\n  font-size: 14px;\n}\n.hp-card.small { width: 31px; height: 43px; border-radius: 4px; font-size: 10px; }\n.hp-card.small .s { font-size: 11px; }\n\n.hp-seat {\n  width: 172px;\n  min-height: 92px;\n  padding: 7px 8px;\n  align-items: center;\n  gap: 2px;\n  color: #202020;\n  background: transparent;\n  border-color: transparent;\n  border-radius: 14px;\n  box-shadow: none;\n  backdrop-filter: none;\n}\n.hp-seat .hp-seat-head { justify-content: center; gap: 7px; overflow: visible; }\n.hp-seat .hp-avatar {\n  width: 36px;\n  height: 36px;\n  color: #fff;\n  background:\n    radial-gradient(circle at 35% 30%, rgba(255,255,255,.55), transparent 16%),\n    linear-gradient(145deg, #4e7bd9, #2e3658 56%, #1d1d26);\n  border: 3px solid #fff;\n  box-shadow: 0 2px 8px rgba(28, 48, 86, .2), 0 0 0 1px #deded9;\n  font-size: 13px;\n}\n.hp-seat:nth-of-type(3n+1) .hp-avatar { background: linear-gradient(145deg, #ff9d70, #e45364 58%, #712d48); }\n.hp-seat:nth-of-type(3n+2) .hp-avatar { background: linear-gradient(145deg, #6fd1c0, #3570a5 58%, #2a365f); }\n.hp-seat .hp-sname { flex: 0 1 auto; max-width: 92px; color: #2b2b29; font-size: 11.5px; font-weight: 600; }\n.hp-seat .hp-ai-badge {\n  flex: none;\n  padding: 1px 5px;\n  color: #2769c9;\n  background: #edf4ff;\n  border: 1px solid #cfe0fa;\n  border-radius: 999px;\n  font-size: 8px;\n  font-weight: 700;\n  letter-spacing: .06em;\n}\n.hp-seat .hp-srow { justify-content: center; min-height: 16px; }\n.hp-seat .hp-sstack { color: #666661; font-size: 10.5px; }\n.hp-seat .hp-sbet {\n  color: #444440;\n  background: #fff;\n  border-color: #e4e4df;\n  box-shadow: 0 1px 4px rgba(20,20,20,.04);\n  font-size: 9.5px;\n}\n.hp-seat .hp-sstate { color: #a05b57; font-size: 9.5px; }\n.hp-seat .hp-sstate.allin { color: #6954bf; }\n.hp-seat .hp-cards {\n  position: absolute;\n  top: -44px;\n  left: 50%;\n  transform: translateX(-50%);\n  min-height: 43px;\n  gap: 3px;\n  margin: 0;\n}\n.hp-seat .hp-dbtn,\n.hp-seat .hp-blind {\n  top: -5px;\n  border: 1px solid #fff;\n  color: #fff;\n  background: #242424;\n  box-shadow: 0 1px 3px rgba(20,20,20,.18);\n}\n.hp-seat .hp-dbtn { right: -5px; width: 17px; height: 17px; font-size: 9px; }\n.hp-seat .hp-blind { left: -7px; color: #fff; background: #202020; font-size: 8px; padding: 1px 4px; }\n.hp-seat .hp-dot { width: 7px; height: 7px; background: #2db672; border-color: #fff; }\n.hp-seat .hp-count { color: #2674dc; font-size: 10px; }\n.hp-seat.me {\n  background: rgba(255,255,255,.9);\n  border-color: #83aaf0;\n  box-shadow: 0 5px 16px rgba(44, 95, 180, .1);\n}\n.hp-seat.turn {\n  border-color: #2475eb;\n  background: rgba(255,255,255,.94);\n  animation: hp-light-turn 1.8s ease-in-out infinite;\n}\n.hp-seat.turn:not(.me) {\n  border-color: transparent;\n  background: transparent;\n  animation: none;\n}\n.hp-seat.turn:not(.me) .hp-avatar {\n  box-shadow: 0 2px 8px rgba(28,48,86,.2), 0 0 0 2px #2475eb, 0 0 0 5px rgba(36,117,235,.1);\n}\n.hp-seat.winner { border-color: #efbd45; background: rgba(255,255,255,.95); }\n\n.hp-dock {\n  width: min(720px, calc(100% - 32px));\n  margin: 4px auto 18px;\n  padding: 4px 0 0;\n  gap: 8px;\n  background: transparent;\n  border: 0;\n}\n.hp-dock .hp-actionrow { justify-content: center; gap: 10px; }\n.hp-action-btn {\n  flex: 0 1 160px;\n  min-width: 118px;\n  min-height: 40px;\n  padding: 9px 18px;\n  color: #292927;\n  background: #fff;\n  border-color: #e0e0dc;\n  border-radius: 999px;\n  box-shadow: 0 2px 7px rgba(20,20,20,.045);\n  font-size: 12px;\n  font-weight: 580;\n}\n.hp-action-btn.fold,\n.hp-action-btn.call,\n.hp-action-btn.bet,\n.hp-action-btn.allin { color: #292927; background: #fff; border-color: #dfdfda; }\n.hp-action-btn.primary-action {\n  color: #fff;\n  background: #171717;\n  border-color: #171717;\n  box-shadow: 0 4px 11px rgba(20,20,20,.12);\n}\n.hp-action-btn:disabled { opacity: .38; }\n.hp-dock .hp-hint { min-height: 16px; text-align: center; color: #a0a09a; font-size: 10.5px; }\n.hp-dock .hp-hint-actions {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n}\n.hp-add-bot-inline {\n  padding: 3px 9px;\n  border: 1px solid #deded9;\n  border-radius: 999px;\n  color: #656560;\n  background: #fff;\n  font: inherit;\n  cursor: pointer;\n}\n.hp-add-bot-inline:hover:not(:disabled) { color: #171717; border-color: #aaa9a2; }\n.hp-add-bot-inline:disabled { opacity: .42; cursor: not-allowed; }\n.hp-bet-presets {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  min-height: 30px;\n}\n.hp-preset {\n  min-width: 42px;\n  height: 24px;\n  padding: 0 9px;\n  color: #777772;\n  background: #fff;\n  border: 1px solid #e3e3de;\n  border-radius: 999px;\n  font-size: 9.5px;\n  cursor: pointer;\n}\n.hp-preset:hover:not(:disabled) { color: #171717; border-color: #cfcfca; }\n.hp-preset.selected { color: #171717; border-color: #a9c6f8; background: #f4f8ff; }\n.hp-preset:disabled { opacity: .42; cursor: default; }\n.hp-preset.allin { color: #555550; }\n.hp-preset-track {\n  width: 120px;\n  height: 14px;\n  margin: 0;\n  padding: 0;\n  accent-color: #2475eb;\n  cursor: pointer;\n}\n.hp-preset-track:disabled { opacity: .42; cursor: default; }\n.hp-preset-value { min-width: 48px; color: #888883; font-size: 9.5px; }\n\n.hp-history-control { top: 57px; }\n.hp-drawer {\n  top: 56px;\n  background: rgba(255,255,255,.97);\n  border-color: #e2e2dd;\n  box-shadow: 0 16px 48px rgba(30,30,30,.1);\n}\n.hp-drawer .hp-drawer-head { border-color: #ecece8; color: #30302e; }\n.hp-log { color: #656560; }\n.hp-log .t { color: #aaa9a3; }\n.hp-showdown { color: #5e553e; background: #fffdf6; border-color: #eadba9; }\n.hp-showdown .w { color: #806622; }\n\n.hp-lobby { color: #222; }\n.hp-wallet,\n.hp-panel { background: #fff; border-color: #e7e7e2; box-shadow: 0 4px 18px rgba(20,20,20,.025); }\n.hp-wallet { color: #7b7b76; }\n.hp-wallet b { color: #222; }\n.hp-panel h3 { color: #666661; }\n.hp-field { color: #858580; }\n.hp-table-item { background: #fafaf8; border-color: #e8e8e3; }\n.hp-table-item .hp-tname { color: #222; }\n.hp-table-item .hp-tmeta { color: #92928d; }\n.hp-empty { color: #92928d; border-color: #deded9; }\n.hp-empty .hp-bigspade { color: #222; }\n\n@keyframes hp-light-turn {\n  0%, 100% { box-shadow: 0 4px 14px rgba(36,117,235,.08); }\n  50% { box-shadow: 0 5px 22px rgba(36,117,235,.2); }\n}\n\n@media (max-width:640px) {\n  .hp-root { background: #fafaf8; }\n  .hp-roombar { padding: 6px 10px; }\n  .hp-roombar .hp-table-meta { padding-right: 76px; }\n  .hp-roombar .hp-brand .hp-crumb { display: none; }\n  .hp-history-control { top: 52px; }\n  .hp-stage { padding: 8px 10px; gap: 8px; }\n  .hp-statusline { margin-top: 2px; background: #fff; }\n  .hp-felt { position: relative; top: auto; left: auto; width: 68%; background: linear-gradient(160deg, #f1f1ee, #e9e9e5); border: 0; }\n  .hp-seat { width: 47%; min-height: 78px; padding: 6px; }\n  .hp-seat.me { width: 70%; }\n  .hp-seat .hp-cards { position: static; transform: none; min-height: 41px; order: -1; }\n  .hp-dock { width: calc(100% - 20px); margin-bottom: 10px; }\n  .hp-bet-presets { gap: 5px; overflow: hidden; }\n  .hp-preset { min-width: 36px; padding-inline: 6px; }\n  .hp-preset-track { display: none; }\n  .hp-preset-value { display: none; }\n  .hp-dock .hp-actionrow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }\n  .hp-action-btn { min-width: 0; min-height: 46px; padding-inline: 5px; }\n  .hp-raise { border-radius: 16px; }\n}\n';

// src/client/styles.ts
var CSS = poker_default;
function injectStyle() {
  const id = "dsh-poker/styles";
  if (typeof document === "undefined") return;
  if (document.querySelector(`style[data-plugin-css="${id}"]`) !== null) return;
  const tag = document.createElement("style");
  tag.dataset.plugin = "dsh-poker";
  tag.dataset.pluginCss = id;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// src/client/entry.ts
injectStyle();
var __test = test_hooks_exports;

    return module.exports;
  },
});
