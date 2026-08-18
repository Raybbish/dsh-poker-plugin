import { WebSocketServer } from "ws";
import { clientMessageSchema } from "../protocol.js";
import { TableError } from "./table-service.js";
const MAX_MESSAGE_BYTES = 64 * 1024;
const HEARTBEAT_INTERVAL_MS = 30_000;
/**
 * Browsers attach an Origin header to WebSocket handshakes but do not enforce
 * the HTTP same-origin policy for the connection itself. Accept browser
 * clients only when Origin matches Host. Non-browser clients (the smoke test,
 * CLI tools) normally omit Origin and remain supported.
 */
export function isAllowedWebSocketOrigin(headers) {
    const origin = headers.origin;
    if (origin === undefined)
        return true;
    if (Array.isArray(origin) || headers.host === undefined)
        return false;
    try {
        const parsed = new URL(origin);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
            return false;
        return parsed.host.toLowerCase() === headers.host.toLowerCase();
    }
    catch {
        return false;
    }
}
export class PokerGateway {
    ctx;
    service;
    bots;
    wss;
    connections = new Map();
    constructor(ctx, service, bots) {
        this.ctx = ctx;
        this.service = service;
        this.bots = bots;
        this.wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });
    }
    start() {
        const disposeRoute = this.ctx.webServer.registerUpgrade({
            path: "/poker/ws",
            handler: (req, socket, head) => {
                if (!isAllowedWebSocketOrigin(req.headers)) {
                    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
                    socket.destroy();
                    return;
                }
                this.wss.handleUpgrade(req, socket, head, (ws) => this.onSocket(ws));
            },
        });
        this.ctx.effect(() => disposeRoute);
        const unsubscribe = this.service.onChanged((tableId) => this.onTableChanged(tableId));
        this.ctx.effect(() => unsubscribe);
        // Heartbeat: close sockets that miss a pong.
        const heartbeatDisposer = this.ctx.timer.interval(() => {
            for (const [ws, state] of this.connections) {
                if (!state.alive) {
                    ws.terminate();
                    this.connections.delete(ws);
                    continue;
                }
                state.alive = false;
                try {
                    ws.ping();
                }
                catch {
                    /* socket already gone */
                }
            }
        }, HEARTBEAT_INTERVAL_MS);
        this.ctx.effect(() => heartbeatDisposer);
        // Teardown: close every socket and the server.
        this.ctx.effect(() => () => {
            for (const [ws, state] of [...this.connections]) {
                this.detach(ws, state);
                try {
                    ws.close();
                }
                catch {
                    /* ignore */
                }
            }
            this.connections.clear();
            this.wss.close();
        });
    }
    onSocket(ws) {
        const state = { ws, alive: true };
        this.connections.set(ws, state);
        ws.on("pong", () => {
            state.alive = true;
        });
        ws.on("message", (data) => {
            void this.onMessage(ws, state, data);
        });
        ws.on("close", () => {
            this.detach(ws, state);
        });
        ws.on("error", () => {
            /* close handler owns cleanup */
        });
        this.send(ws, { type: "welcome", serverTime: Date.now() });
        this.send(ws, { type: "lobby", tables: this.service.lobbyView() });
    }
    detach(ws, state) {
        if (state.tableId !== undefined && state.playerId !== undefined) {
            void this.service.setConnected(state.playerId, state.tableId, false);
        }
        this.connections.delete(ws);
    }
    async onMessage(ws, state, data) {
        let msg;
        try {
            const raw = Buffer.isBuffer(data) ? data.toString() : typeof data === "string" ? data : String(data);
            msg = clientMessageSchema.parse(JSON.parse(raw));
        }
        catch {
            this.send(ws, { type: "error", code: "bad-request", message: "invalid message" });
            return;
        }
        try {
            switch (msg.type) {
                case "joinLobby":
                    // Leaving any table/spectate subscription: this connection only
                    // watches the lobby again.
                    state.tableId = undefined;
                    this.send(ws, { type: "lobby", tables: this.service.lobbyView() });
                    break;
                case "createTable": {
                    await this.service.createTable(msg.name, msg.maxSeats);
                    this.send(ws, { type: "lobby", tables: this.service.lobbyView() });
                    break;
                }
                case "joinTable": {
                    const result = await this.service.joinTable(msg.tableId, msg.nickname, msg.buyIn, msg.playerId, msg.token);
                    state.playerId = result.playerId;
                    state.token = result.token;
                    state.tableId = result.tableId;
                    // A fresh socket counts as a connected seat (starts the game when ≥2).
                    await this.service.setConnected(result.playerId, result.tableId, true);
                    this.send(ws, {
                        type: "joined",
                        requestId: msg.requestId,
                        playerId: result.playerId,
                        token: result.token,
                        tableId: result.tableId,
                        seat: result.seat,
                        stack: result.stack,
                        wallet: result.wallet,
                    });
                    this.send(ws, { type: "wallet", balance: this.service.walletOf(result.playerId) });
                    state.lastWallet = this.service.walletOf(result.playerId);
                    this.send(ws, { type: "snapshot", table: this.service.snapshotFor(result.tableId, result.playerId) });
                    break;
                }
                case "addBot": {
                    if (state.playerId === undefined || state.tableId !== msg.tableId)
                        throw new TableError("join the table before adding a bot", "unauthorized");
                    if (this.bots === undefined)
                        throw new TableError("AI bot is unavailable — configure a server-side API key and restart dsh web", "bot-unavailable");
                    await this.bots.addBot(msg.tableId, state.playerId);
                    break;
                }
                case "leaveTable": {
                    if (state.playerId === undefined)
                        throw new TableError("not authenticated", "unauthorized");
                    await this.service.leaveTable(state.playerId, msg.tableId);
                    state.tableId = undefined;
                    this.send(ws, { type: "lobby", tables: this.service.lobbyView() });
                    this.send(ws, { type: "wallet", balance: this.service.walletOf(state.playerId) });
                    state.lastWallet = this.service.walletOf(state.playerId);
                    break;
                }
                case "action": {
                    if (state.playerId !== msg.playerId)
                        throw new TableError("identity mismatch", "unauthorized");
                    if (state.token === undefined)
                        throw new TableError("not authenticated", "unauthorized");
                    await this.service.action(msg.playerId, msg.tableId, msg.commandId, msg.expectedVersion, msg.action, msg.amount);
                    break;
                }
                case "resume": {
                    const ok = await this.service.resume(msg.playerId, msg.token, msg.tableId);
                    if (!ok) {
                        this.send(ws, { type: "error", requestId: msg.requestId, code: "resume-failed", message: "session expired — join the table again" });
                        break;
                    }
                    state.playerId = msg.playerId;
                    state.token = msg.token;
                    state.tableId = msg.tableId;
                    this.send(ws, {
                        type: "joined",
                        requestId: msg.requestId,
                        playerId: msg.playerId,
                        token: msg.token,
                        tableId: msg.tableId,
                        seat: this.service.snapshotFor(msg.tableId, msg.playerId).mySeat ?? -1,
                        stack: this.service.snapshotFor(msg.tableId, msg.playerId).seats.find((s) => s.playerId === msg.playerId)?.stack ?? 0,
                        wallet: this.service.walletOf(msg.playerId),
                    });
                    this.send(ws, { type: "snapshot", table: this.service.snapshotFor(msg.tableId, msg.playerId) });
                    this.send(ws, { type: "wallet", balance: this.service.walletOf(msg.playerId) });
                    state.lastWallet = this.service.walletOf(msg.playerId);
                    break;
                }
                case "requestSnapshot": {
                    // Subscribe to a table's public snapshots. The view is built for the
                    // requester's own identity when seated, or as a spectator (viewer
                    // "") otherwise — spectators receive only public information and
                    // never any hole cards. Wire format is unchanged.
                    state.tableId = msg.tableId;
                    this.send(ws, { type: "snapshot", table: this.service.snapshotFor(msg.tableId, state.playerId ?? "") });
                    break;
                }
                case "ping":
                    this.send(ws, { type: "pong", t: msg.t ?? Date.now() });
                    break;
            }
        }
        catch (err) {
            const e = err instanceof TableError ? err : err instanceof Error ? new TableError(err.message, "internal") : new TableError("unknown error", "internal");
            this.send(ws, { type: "error", requestId: "requestId" in msg ? msg.requestId : undefined, code: e.code, message: e.message });
        }
    }
    onTableChanged(tableId) {
        for (const state of this.connections.values()) {
            if (state.tableId === tableId) {
                // Seated player or spectator: both receive this table's snapshots;
                // only a seated player's view ever contains their own hole cards.
                this.send(state.ws, { type: "snapshot", table: this.service.snapshotFor(tableId, state.playerId ?? "") });
                if (state.playerId !== undefined) {
                    // Push wallet updates (e.g. a delayed cash-out at hand end).
                    const balance = this.service.walletOf(state.playerId);
                    if (state.lastWallet === undefined || state.lastWallet !== balance) {
                        state.lastWallet = balance;
                        this.send(state.ws, { type: "wallet", balance });
                    }
                }
            }
            else if (state.tableId === undefined) {
                // Lobby viewers get a fresh lobby view whenever anything changes.
                this.send(state.ws, { type: "lobby", tables: this.service.lobbyView() });
            }
        }
    }
    send(ws, message) {
        if (ws.readyState !== ws.OPEN)
            return;
        try {
            ws.send(JSON.stringify(message));
        }
        catch {
            /* ignore send errors; close handler owns cleanup */
        }
    }
}
//# sourceMappingURL=gateway.js.map