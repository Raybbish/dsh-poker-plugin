/**
 * Type-only imports that load the `declare module '@deepseek-ai/cordis'`
 * augmentations for `ctx.webServer`, `ctx.timer` and `ctx.storageDomain`.
 * Nothing here is emitted at runtime.
 */
import type {} from "@deepseek-ai/cordis-plugin-timer";
import type { WebServer } from "@deepseek-ai/dsh-host-webserver";
import type {} from "@deepseek-ai/dsh-storage-domain";

export type { WebServer };
