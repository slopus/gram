import { createPiAiProviderPlugin } from "../_common/pi-ai-provider/plugin.js";

export const plugin = createPiAiProviderPlugin({
  id: "vercel-ai-gateway",
  label: "Vercel AI Gateway",
  auth: "apiKey"
});
