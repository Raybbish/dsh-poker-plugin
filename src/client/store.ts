/**
 * Client-side store, WebSocket transport and actions.
 * Ported verbatim from the previous single-file bundle: the server remains the
 * single source of truth; the client renders snapshots and sends commands.
 */
import * as React from "react";

export interface Session {
  playerId: string;
  token: string;
  tableId: string;
  nickname: string;
}

export interface StoreShape {
  open: boolean;
  ws: WebSocket | null;
  connecting: boolean;
  retryTimer: ReturnType<typeof setTimeout> | null;
  retry: number;
  connected: boolean;
  session: Session | null;
  nickname: string;
  lobby: unknown[];
  table: unknown;
  spectateTableId: string | null;
  wallet: number | null;
  error: string | null;
  listeners: Set<() => void>;
  subscribe(fn: () => void): () => void;
  emit(): void;
  set(patch: Partial<StoreShape>): void;
}

export const Store: StoreShape = {
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
  listeners: new Set(),
  subscribe(this: StoreShape, fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  },
  emit(this: StoreShape) {
    for (const fn of [...this.listeners]) {
      try {
        fn();
      } catch (e) {
        console.error("poker store listener", e);
      }
    }
  },
  set(this: StoreShape, patch: Partial<StoreShape>) {
    Object.assign(this, patch);
    if (typeof window !== "undefined") (window as any).__hpStore = { ...this, listeners: undefined };
    this.emit();
  },
};

export function useStore(): StoreShape {
  const force = React.useReducer((x: number) => x + 1, 0)[1];
  React.useEffect(() => Store.subscribe(force), []);
  return Store;
}

// ── helpers ──────────────────────────────────────────────────────────────────

let seq = 0;
export function rid(): string {
  return "r" + (++seq).toString(36) + Date.now().toString(36);
}

export function cardLabel(rank: number): string {
  return rank === 14 ? "A" : rank === 13 ? "K" : rank === 12 ? "Q" : rank === 11 ? "J" : rank === 10 ? "T" : String(rank);
}
export function suitChar(suit: number): string {
  return suit === 0 ? "♣" : suit === 1 ? "♦" : suit === 2 ? "♥" : "♠";
}
export function suitRed(suit: number): boolean {
  return suit === 1 || suit === 2;
}
export function cardId(c: { rank: number; suit: number }): string {
  return c.rank + ("cdhs"[c.suit] ?? "?");
}
export function fmt(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export function timeStr(at: number): string {
  const d = new Date(at);
  const p = (x: number) => (x < 10 ? "0" + x : "" + x);
  return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem("dsh-poker-session");
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (typeof s.playerId === "string" && typeof s.token === "string") return s;
  } catch (e) {
    /* ignore */
  }
  return null;
}

export function writeSession(s: Session | null): void {
  try {
    if (s === null) localStorage.removeItem("dsh-poker-session");
    else localStorage.setItem("dsh-poker-session", JSON.stringify(s));
  } catch (e) {
    /* ignore */
  }
}

// ── WebSocket client ─────────────────────────────────────────────────────────

export function connect(): void {
  if (Store.ws !== null || Store.connecting) return;
  Store.set({ connecting: true, error: null });
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  let ws: WebSocket;
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
    let msg: unknown;
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
      /* ignore */
    }
  };
}

function scheduleReconnect(): void {
  if (Store.retryTimer !== null) return;
  Store.retryTimer = setTimeout(() => {
    Store.retryTimer = null;
    Store.retry = Math.min(Store.retry + 1, 6);
    connect();
  }, Math.min(1000 * Math.pow(2, Store.retry), 15000));
}

export function send(msg: Record<string, unknown>): boolean {
  const ws = Store.ws;
  if (ws === null || ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(JSON.stringify(msg));
    return true;
  } catch (e) {
    return false;
  }
}

export function handleMessage(msg: any): void {
  switch (msg.type) {
    case "pong":
      return;
    case "lobby":
      Store.set({ lobby: msg.tables });
      return;
    case "joined": {
      const session: Session = { playerId: msg.playerId, token: msg.token, tableId: msg.tableId, nickname: Store.nickname || "Player" };
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
      }, 5000);
      return;
    }
    default:
      return;
  }
}

// ── actions (client → server) ────────────────────────────────────────────────

export function createTable(name: string, maxSeats: number): void {
  send({ type: "createTable", requestId: rid(), name, maxSeats });
}

export function joinTable(tableId: string, nickname: string, buyIn: number): void {
  const msg: Record<string, unknown> = { type: "joinTable", requestId: rid(), tableId, nickname, buyIn };
  if (Store.session !== null) {
    msg.playerId = Store.session.playerId;
    msg.token = Store.session.token;
  }
  Store.set({ nickname });
  send(msg);
}

export function leaveTable(): void {
  if (Store.session === null || Store.table === null) return;
  send({ type: "leaveTable", requestId: rid(), tableId: (Store.table as any).tableId });
  Store.set({ session: null, table: null, spectateTableId: null });
  writeSession(null);
  send({ type: "joinLobby", requestId: rid() });
}

export function addBot(tableId: string): void {
  send({ type: "addBot", requestId: rid(), tableId });
}

export function watchTable(tableId: string): void {
  Store.set({ spectateTableId: tableId, error: null });
  send({ type: "requestSnapshot", requestId: rid(), tableId });
}

export function stopWatching(): void {
  Store.set({ spectateTableId: null, table: null });
  send({ type: "joinLobby", requestId: rid() });
}

export function playAction(type: string, amount?: number): void {
  const t = Store.table as any;
  const s = Store.session;
  if (t === null || s === null) return;
  send({
    type: "action",
    commandId: "c" + (++seq).toString(36) + Date.now().toString(36),
    playerId: s.playerId,
    tableId: t.tableId,
    expectedVersion: t.version,
    action: type,
    amount,
  });
}
