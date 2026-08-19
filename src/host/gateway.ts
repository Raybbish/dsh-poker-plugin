/**
 * Realtime gateway — the WebSocket transport.
 *
 * One upgrade route `/poker/ws` on the harness webserver. Each socket is one
 * connection; identity is bound by `joinTable`/`resume` (playerId + token).
 * The server pushes per-player snapshots (private views built by the
 * TableService/protocol layer) on every table change, and rejects any command
 * not authenticated as the seated player.
 */
import { Context } from "@deepseek-ai/cordis";
import type { IncomingHttpHeaders } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { ClientMessage, clientMessageSchema, ServerMessage } from "../protocol.js";
import { TableError, TableService } from "./table-service.js";
import { ActionType } from "../engine/types.js";
import type {} from "./types-augment.js";
import type { BotController, ConfigurableBotDecisionProvider } from "./bot-controller.js";

interface ConnectionState {
  ws: WebSocket;
  playerId?: string;
  token?: string;
  tableId?: string;
  alive: boolean;
  canConfigureBots: boolean;
  /** Last wallet balance pushed to this socket (so updates are sent on change). */
  lastWallet?: number;
}

const MAX_MESSAGE_BYTES = 64 * 1024;
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Browsers attach an Origin header to WebSocket handshakes but do not enforce
 * the HTTP same-origin policy for the connection itself. Accept browser
 * clients only when Origin matches Host. Non-browser clients (the smoke test,
 * CLI tools) normally omit Origin and remain supported.
 */
export function isAllowedWebSocketOrigin(headers: IncomingHttpHeaders): boolean {
  const origin = headers.origin;
  if (origin === undefined) return true;
  if (Array.isArray(origin) || headers.host === undefined) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return parsed.host.toLowerCase() === headers.host.toLowerCase();
  } catch {
    return false;
  }
}

function isLoopback(value: string | undefined): boolean {
  if (value === undefined) return false;
  const address = value.toLowerCase();
  return address === "::1" || address.startsWith("127.") || address.startsWith("::ffff:127.");
}

function isLoopbackHost(host: string | undefined): boolean {
  if (host === undefined) return false;
  try {
    const hostname = new URL(`http://${host}`).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return hostname === "localhost" || hostname === "::1" || hostname.startsWith("127.");
  } catch {
    return false;
  }
}

/** Raw AI credentials are accepted only from a same-origin loopback browser. */
export function isLocalBotConfigurationRequest(remoteAddress: string | undefined, headers: IncomingHttpHeaders): boolean {
  return headers.origin !== undefined && isLoopback(remoteAddress) && isLoopbackHost(headers.host) && isAllowedWebSocketOrigin(headers);
}

export class PokerGateway {
  private readonly wss: WebSocketServer;
  private readonly connections = new Map<WebSocket, ConnectionState>();

  constructor(
    private readonly ctx: Context,
    private readonly service: TableService,
    private readonly bots: BotController,
    private readonly botProvider: ConfigurableBotDecisionProvider,
  ) {
    this.wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE_BYTES });
  }

  start(): void {
    const disposeRoute = this.ctx.webServer.registerUpgrade({
      path: "/poker/ws",
      handler: (req, socket, head) => {
        if (!isAllowedWebSocketOrigin(req.headers)) {
          socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
          socket.destroy();
          return;
        }
        const canConfigureBots = isLocalBotConfigurationRequest(req.socket.remoteAddress, req.headers);
        this.wss.handleUpgrade(req, socket, head, (ws) => this.onSocket(ws, canConfigureBots));
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
        } catch {
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
        } catch {
          /* ignore */
        }
      }
      this.connections.clear();
      this.wss.close();
    });
  }

  private onSocket(ws: WebSocket, canConfigureBots: boolean): void {
    const state: ConnectionState = { ws, alive: true, canConfigureBots };
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
    this.sendBotConfiguration(state);
    this.send(ws, { type: "lobby", tables: this.service.lobbyView() });
  }

  private detach(ws: WebSocket, state: ConnectionState): void {
    if (state.tableId !== undefined && state.playerId !== undefined) {
      void this.service.setConnected(state.playerId, state.tableId, false);
    }
    this.connections.delete(ws);
  }

  private async onMessage(ws: WebSocket, state: ConnectionState, data: unknown): Promise<void> {
    let msg: ClientMessage;
    try {
      const raw = Buffer.isBuffer(data) ? data.toString() : typeof data === "string" ? data : String(data);
      msg = clientMessageSchema.parse(JSON.parse(raw));
    } catch {
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
          if (state.playerId === undefined || state.tableId !== msg.tableId) throw new TableError("join the table before adding a bot", "unauthorized");
          if (!this.botProvider.configured) throw new TableError("AI bot is unavailable — configure an API key", "bot-unavailable");
          await this.bots.addBot(msg.tableId, state.playerId);
          break;
        }
        case "configureBotApi": {
          if (!state.canConfigureBots) throw new TableError("AI settings can only be changed from this computer", "unauthorized");
          this.botProvider.configure(msg.apiKey);
          this.ctx.logger.info("dsh-poker: AI bot provider configured from the local game UI (memory only).");
          for (const connection of this.connections.values()) {
            this.sendBotConfiguration(connection, connection === state ? msg.requestId : undefined);
          }
          break;
        }
        case "deleteTable": {
          if (!state.canConfigureBots) throw new TableError("Rooms can only be deleted from this computer", "unauthorized");
          await this.service.deleteTable(msg.tableId);
          break;
        }
        case "leaveTable": {
          if (state.playerId === undefined) throw new TableError("not authenticated", "unauthorized");
          await this.service.leaveTable(state.playerId, msg.tableId);
          state.tableId = undefined;
          this.send(ws, { type: "lobby", tables: this.service.lobbyView() });
          this.send(ws, { type: "wallet", balance: this.service.walletOf(state.playerId) });
          state.lastWallet = this.service.walletOf(state.playerId);
          break;
        }
        case "action": {
          if (state.playerId !== msg.playerId) throw new TableError("identity mismatch", "unauthorized");
          if (state.token === undefined) throw new TableError("not authenticated", "unauthorized");
          await this.service.action(
            msg.playerId,
            msg.tableId,
            msg.commandId,
            msg.expectedVersion,
            msg.action as ActionType,
            msg.amount,
          );
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
    } catch (err) {
      const e = err instanceof TableError ? err : err instanceof Error ? new TableError(err.message, "internal") : new TableError("unknown error", "internal");
      this.send(ws, { type: "error", requestId: "requestId" in msg ? (msg as { requestId?: string }).requestId : undefined, code: e.code, message: e.message });
    }
  }

  private onTableChanged(tableId: string): void {
    const deleted = this.service.getState(tableId) === undefined;
    for (const state of this.connections.values()) {
      if (state.tableId === tableId) {
        if (deleted) {
          state.tableId = undefined;
          this.send(state.ws, { type: "tableDeleted", tableId });
          if (state.playerId !== undefined) {
            const balance = this.service.walletOf(state.playerId);
            state.lastWallet = balance;
            this.send(state.ws, { type: "wallet", balance });
          }
          this.send(state.ws, { type: "lobby", tables: this.service.lobbyView() });
          continue;
        }
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
      } else if (state.tableId === undefined) {
        // Lobby viewers get a fresh lobby view whenever anything changes.
        this.send(state.ws, { type: "lobby", tables: this.service.lobbyView() });
      }
    }
  }

  private sendBotConfiguration(state: ConnectionState, requestId?: string): void {
    this.send(state.ws, {
      type: "botConfiguration",
      ...(requestId === undefined ? {} : { requestId }),
      configured: this.botProvider.configured,
      configurable: state.canConfigureBots,
    });
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState !== ws.OPEN) return;
    try {
      ws.send(JSON.stringify(message));
    } catch {
      /* ignore send errors; close handler owns cleanup */
    }
  }
}
