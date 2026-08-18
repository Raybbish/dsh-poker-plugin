/**
 * dsh-poker host entry — the Cordis plugin mounted by the web profile.
 *
 * Opens the poker storage domain, boots the TableService (authoritative game
 * state + Play Token ledger), and starts the WebSocket gateway on the harness
 * webserver. All resources (domain, routes, timers, sockets) are released
 * through ctx.effect disposers when the plugin unmounts.
 */
import { Context } from "@deepseek-ai/cordis";
export declare const name = "dsh-poker";
export declare const inject: string[];
export declare function apply(ctx: Context, rawConfig?: unknown): Promise<void>;
declare const plugin: {
    name: string;
    inject: string[];
    apply: typeof apply;
};
export default plugin;
