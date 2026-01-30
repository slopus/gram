import path from "node:path";

import { z } from "zod";

import { TelegramConnector, type TelegramConnectorOptions } from "../connectors/telegram.js";
import { definePlugin, type PluginOnboardingApi } from "./types.js";

const settingsSchema = z
  .object({
    polling: z.boolean().optional(),
    clearWebhook: z.boolean().optional(),
    statePath: z.string().nullable().optional(),
    retry: z
      .object({
        minDelayMs: z.number().optional(),
        maxDelayMs: z.number().optional(),
        factor: z.number().optional(),
        jitter: z.number().optional()
      })
      .optional()
  })
  .passthrough();

type TelegramPluginConfig = Omit<TelegramConnectorOptions, "token" | "fileStore" | "dataDir">;

export const plugin = definePlugin({
  settingsSchema,
  onboarding: async (api) => {
    const token = await api.prompt.input({
      message: "Telegram bot token"
    });
    if (!token) {
      return null;
    }
    await api.auth.setToken(api.instanceId, token);

    const polling = await api.prompt.confirm({
      message: "Enable polling?",
      default: true
    });
    if (polling === null) {
      return null;
    }

    const clearWebhook = await api.prompt.confirm({
      message: "Clear webhook on start?",
      default: true
    });
    if (clearWebhook === null) {
      return null;
    }

    const statePath = await api.prompt.input({
      message: "State file path (optional, leave blank for default)"
    });
    if (statePath === null) {
      return null;
    }

    const minDelayMs = await promptNumber(api, "Retry min delay ms (optional)");
    if (minDelayMs === null) {
      return null;
    }
    const maxDelayMs = await promptNumber(api, "Retry max delay ms (optional)");
    if (maxDelayMs === null) {
      return null;
    }
    const factor = await promptNumber(api, "Retry backoff factor (optional)");
    if (factor === null) {
      return null;
    }
    const jitter = await promptNumber(api, "Retry jitter (optional)");
    if (jitter === null) {
      return null;
    }

    const retry =
      minDelayMs !== undefined ||
      maxDelayMs !== undefined ||
      factor !== undefined ||
      jitter !== undefined
        ? {
            minDelayMs,
            maxDelayMs,
            factor,
            jitter
          }
        : undefined;

    const settings: Record<string, unknown> = {
      polling,
      clearWebhook
    };
    if (statePath) {
      settings.statePath = statePath;
    }
    if (retry) {
      settings.retry = retry;
    }

    return { settings };
  },
  create: (api) => {
    const connectorId = api.instance.instanceId;
    return {
      load: async () => {
        const token = await api.auth.getToken(connectorId);
        if (!token) {
          throw new Error("Missing telegram token in auth store");
        }
        const config = api.settings as TelegramPluginConfig;
        const statePath =
          config.statePath === undefined
            ? path.join(api.dataDir, "telegram-offset.json")
            : config.statePath;
        const connector = new TelegramConnector({
          ...config,
          statePath,
          token,
          fileStore: api.fileStore,
          dataDir: api.dataDir,
          enableGracefulShutdown: false,
          onFatal: (reason, error) => {
            api.logger.warn({ reason, error }, "Telegram connector fatal");
          }
        });
        api.registrar.registerConnector(connectorId, connector);
      },
      unload: async () => {
        await api.registrar.unregisterConnector(connectorId);
      }
    };
  }
});

async function promptNumber(
  api: PluginOnboardingApi,
  message: string
): Promise<number | undefined | null> {
  while (true) {
    const value = await api.prompt.input({ message });
    if (value === null) {
      return null;
    }
    if (value.trim() === "") {
      return undefined;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
    api.note("Enter a valid number or leave blank.", "Invalid input");
  }
}
