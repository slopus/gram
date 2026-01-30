import {
  complete,
  getModel,
  getModels,
  getOAuthApiKey,
  stream,
  type Api,
  type Model,
  type OAuthCredentials,
  type OAuthProviderId
} from "@mariozechner/pi-ai";
import { z } from "zod";

import type { AuthStore } from "../auth/store.js";
import { definePlugin } from "./types.js";

export type PiAiProviderSpec = {
  id: string;
  label: string;
  auth: "apiKey" | "oauth" | "mixed" | "none";
};

export function createPiAiProviderPlugin(spec: PiAiProviderSpec) {
  return definePlugin({
    settingsSchema: z.object({}).passthrough(),
    create: (api) => {
      const providerId = api.instance.instanceId;
      return {
        load: async () => {
          api.registrar.registerInferenceProvider({
            id: providerId,
            label: spec.label,
            createClient: async (options) => {
              const modelId = resolveModelId(spec.id, options.model);
              const model = getModel(spec.id as never, modelId as never);
              if (!model) {
                throw new Error(`Unknown ${spec.id} model: ${modelId}`);
              }
              const apiKey = await resolveApiKey(spec, options.auth);
              return {
                modelId: model.id,
                complete: (ctx, runtimeOptions) =>
                  complete(
                    model as Model<Api>,
                    ctx,
                    buildOptions(apiKey, options.config, runtimeOptions)
                  ),
                stream: (ctx, runtimeOptions) =>
                  stream(
                    model as Model<Api>,
                    ctx,
                    buildOptions(apiKey, options.config, runtimeOptions)
                  )
              };
            }
          });
        },
        unload: async () => {
          api.registrar.unregisterInferenceProvider(providerId);
        }
      };
    }
  });
}

function resolveModelId(providerId: string, preferred?: string): string {
  const models = getModels(providerId as never);
  if (models.length === 0) {
    throw new Error(`No models available for provider ${providerId}`);
  }

  if (preferred) {
    const match = models.find((model) => model.id === preferred);
    if (match) {
      return match.id;
    }
  }

  const latest =
    models.find((model) => model.id.endsWith("-latest")) ??
    models.find((model) => model.id.includes("latest"));
  return latest?.id ?? models[0]!.id;
}

function buildOptions(
  apiKey: string | null,
  config?: Record<string, unknown>,
  runtimeOptions?: Record<string, unknown>
): Record<string, unknown> {
  const merged = {
    ...(config ?? {}),
    ...(runtimeOptions ?? {})
  };
  if (apiKey) {
    merged.apiKey = (runtimeOptions as { apiKey?: string } | undefined)?.apiKey ?? apiKey;
  }
  return merged;
}

async function resolveApiKey(
  spec: PiAiProviderSpec,
  auth: AuthStore
): Promise<string | null> {
  if (spec.auth === "none") {
    return null;
  }

  const config = await auth.read();
  const entry = config[spec.id] ?? null;
  const needsOAuth = spec.auth === "oauth";
  const allowOAuth = spec.auth === "oauth" || spec.auth === "mixed";

  if (allowOAuth && entry?.type === "oauth") {
    const credentials = stripOAuth(entry);
    const result = await getOAuthApiKey(spec.id as OAuthProviderId, {
      [spec.id]: credentials
    });
    if (!result) {
      if (needsOAuth) {
        throw new Error(`Missing OAuth credentials for ${spec.id}`);
      }
      return null;
    }
    await auth.setOAuth(spec.id, result.newCredentials as unknown as Record<string, unknown>);
    return result.apiKey;
  }

  const apiKey = entry?.apiKey ?? null;
  if (!apiKey && needsOAuth) {
    throw new Error(`Missing OAuth credentials for ${spec.id}`);
  }
  if (!apiKey && spec.auth === "apiKey") {
    throw new Error(`Missing ${spec.id} apiKey in auth store`);
  }
  return apiKey;
}

function stripOAuth(entry: Record<string, unknown>): OAuthCredentials {
  const { type: _type, ...rest } = entry;
  return rest as OAuthCredentials;
}
