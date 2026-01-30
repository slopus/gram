import { createPiAiProviderPlugin } from "../_common/pi-ai-provider/plugin.js";

export const plugin = createPiAiProviderPlugin({
  id: "mistral",
  label: "Mistral",
  auth: "apiKey"
});
