import { createPiAiProviderPlugin } from "../_common/pi-ai-provider/plugin.js";

export const plugin = createPiAiProviderPlugin({
  id: "openai-codex",
  label: "OpenAI Codex",
  auth: "oauth"
});
