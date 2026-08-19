/**
 * dsh-poker host entry — the Cordis plugin mounted by the web profile.
 *
 * Opens the poker storage domain, boots the TableService (authoritative game
 * state + Play Token ledger), and starts the WebSocket gateway on the harness
 * webserver. All resources (domain, routes, timers, sockets) are released
 * through ctx.effect disposers when the plugin unmounts.
 */
import { Context } from "@deepseek-ai/cordis";
import { z } from "zod";
import { pokerDomainSpec } from "./persistence.js";
import { TableService } from "./table-service.js";
import { PokerGateway } from "./gateway.js";
import { BotController, ConfigurableBotDecisionProvider, DeepSeekDecisionProvider } from "./bot-controller.js";

const configSchema = z.object({
  smallBlind: z.number().int().min(1).optional(),
  bigBlind: z.number().int().min(2).optional(),
  buyIn: z.number().int().min(1).optional(),
  maxSeats: z.number().int().min(2).max(10).optional(),
  actionTimeoutMs: z.number().int().min(1000).optional(),
  startingWallet: z.number().int().min(1).optional(),
  deepseekApiKey: z.string().min(1).optional(),
  deepseekBaseUrl: z.string().url().optional(),
  deepseekModel: z.string().min(1).optional(),
  botDecisionTimeoutMs: z.number().int().min(1000).max(60000).optional(),
});

export const name = "dsh-poker";

export const inject = ["storageDomain", "webServer", "timer"];

export async function apply(ctx: Context, rawConfig?: unknown): Promise<void> {
  const config = configSchema.parse(rawConfig ?? {});

  const domain = await ctx.storageDomain.open(pokerDomainSpec);
  ctx.effect(() => () => domain.close());

  const service = new TableService(ctx, domain, config);
  await service.init();
  ctx.effect(() => service.dispose);

  const apiKey = config.deepseekApiKey ?? process.env.DEEPSEEK_API_KEY;
  const botProvider = new ConfigurableBotDecisionProvider((configuredKey) =>
    new DeepSeekDecisionProvider({
      apiKey: configuredKey,
      baseUrl: config.deepseekBaseUrl,
      model: config.deepseekModel,
      timeoutMs: config.botDecisionTimeoutMs,
    }),
  );
  if (apiKey !== undefined) botProvider.configure(apiKey);
  const bots = new BotController(service, botProvider, {
    schedule: (callback, delayMs) => ctx.timer.timeout(callback, delayMs),
    logger: ctx.logger,
  });
  bots.start();
  ctx.effect(() => () => bots.dispose());

  const gateway = new PokerGateway(ctx, service, bots, botProvider);
  gateway.start();

  ctx.logger.info(`dsh-poker: game center ready (AI bots ${botProvider.configured ? "enabled" : "awaiting local API key"}).`);
}

const plugin = { name, inject, apply };
export default plugin;
