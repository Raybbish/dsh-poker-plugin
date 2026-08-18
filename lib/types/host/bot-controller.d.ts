import type { ActionType } from "../engine/types.js";
import type { TableView } from "../protocol.js";
import { TableService, type JoinResult } from "./table-service.js";
export interface BotDecision {
    action: ActionType;
    amount?: number;
}
export interface BotDecisionProvider {
    decide(view: TableView): Promise<BotDecision>;
}
interface BotHttpResponse {
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
}
type BotFetch = (url: string, init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
}) => Promise<BotHttpResponse>;
export interface DeepSeekDecisionProviderOptions {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    timeoutMs?: number;
    fetcher?: BotFetch;
}
/** OpenAI-compatible DeepSeek adapter with strict JSON output and a hard timeout. */
export declare class DeepSeekDecisionProvider implements BotDecisionProvider {
    private readonly options;
    private readonly baseUrl;
    private readonly model;
    private readonly timeoutMs;
    private readonly fetcher;
    constructor(options: DeepSeekDecisionProviderOptions);
    decide(view: TableView): Promise<BotDecision>;
}
/** Validate a model proposal against the current engine-produced legal set. */
export declare function chooseBotAction(view: TableView, proposed?: BotDecision): BotDecision;
export interface BotControllerOptions {
    decisionDelayMs?: number;
    schedule?: (callback: () => void, delayMs: number) => () => void;
    logger?: {
        warn(message: string): void;
    };
}
/** Watches table changes and turns each AI seat into one validated engine command. */
export declare class BotController {
    private readonly service;
    private readonly provider;
    private readonly delayMs;
    private readonly scheduleCallback;
    private readonly logger;
    private readonly pending;
    private readonly inFlight;
    private unsubscribe?;
    private disposed;
    constructor(service: TableService, provider: BotDecisionProvider, options?: BotControllerOptions);
    start(): void;
    addBot(tableId: string, requestedByPlayerId: string): Promise<JoinResult>;
    dispose(): void;
    private schedule;
    private playIfBotTurn;
}
export {};
