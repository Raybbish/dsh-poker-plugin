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
import { TableService } from "./table-service.js";
import type { BotController, ConfigurableBotDecisionProvider } from "./bot-controller.js";
/**
 * Browsers attach an Origin header to WebSocket handshakes but do not enforce
 * the HTTP same-origin policy for the connection itself. Accept browser
 * clients only when Origin matches Host. Non-browser clients (the smoke test,
 * CLI tools) normally omit Origin and remain supported.
 */
export declare function isAllowedWebSocketOrigin(headers: IncomingHttpHeaders): boolean;
/** Raw AI credentials are accepted only from a same-origin loopback browser. */
export declare function isLocalBotConfigurationRequest(remoteAddress: string | undefined, headers: IncomingHttpHeaders): boolean;
export declare class PokerGateway {
    private readonly ctx;
    private readonly service;
    private readonly bots;
    private readonly botProvider;
    private readonly wss;
    private readonly connections;
    constructor(ctx: Context, service: TableService, bots: BotController, botProvider: ConfigurableBotDecisionProvider);
    start(): void;
    private onSocket;
    private detach;
    private onMessage;
    private onTableChanged;
    private sendBotConfiguration;
    private send;
}
