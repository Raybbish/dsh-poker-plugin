import { z } from "zod";
import { pokerDomainSpec } from "./persistence.js";
import { TableService } from "./table-service.js";
import { PokerGateway } from "./gateway.js";
import { BotController, DeepSeekDecisionProvider } from "./bot-controller.js";
const configSchema = z.object({
    smallBlind: z.number().int().min(1).optional(),
    bigBlind: z.number().int().min(2).optional(),
    buyIn: z.number().int().min(1).optional(),
    maxSeats: z.number().int().min(2).max(6).optional(),
    actionTimeoutMs: z.number().int().min(1000).optional(),
    startingWallet: z.number().int().min(1).optional(),
    deepseekApiKey: z.string().min(1).optional(),
    deepseekBaseUrl: z.string().url().optional(),
    deepseekModel: z.string().min(1).optional(),
    botDecisionTimeoutMs: z.number().int().min(1000).max(60000).optional(),
});
export const name = "dsh-poker";
export const inject = ["storageDomain", "webServer", "timer"];
export async function apply(ctx, rawConfig) {
    const config = configSchema.parse(rawConfig ?? {});
    const domain = await ctx.storageDomain.open(pokerDomainSpec);
    ctx.effect(() => () => domain.close());
    const service = new TableService(ctx, domain, config);
    await service.init();
    ctx.effect(() => service.dispose);
    const apiKey = config.deepseekApiKey ?? process.env.DEEPSEEK_API_KEY;
    const bots = apiKey === undefined
        ? undefined
        : new BotController(service, new DeepSeekDecisionProvider({
            apiKey,
            baseUrl: config.deepseekBaseUrl,
            model: config.deepseekModel,
            timeoutMs: config.botDecisionTimeoutMs,
        }), {
            schedule: (callback, delayMs) => ctx.timer.timeout(callback, delayMs),
            logger: ctx.logger,
        });
    bots?.start();
    if (bots !== undefined)
        ctx.effect(() => () => bots.dispose());
    const gateway = new PokerGateway(ctx, service, bots);
    gateway.start();
    ctx.logger.info(`dsh-poker: game center ready (AI bots ${bots === undefined ? "disabled — configure a server-side API key" : "enabled"}).`);
}
const plugin = { name, inject, apply };
export default plugin;
//# sourceMappingURL=index.js.map