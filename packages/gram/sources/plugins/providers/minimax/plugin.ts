import { createPiAiProviderPlugin } from "../_common/pi-ai-provider/plugin.js";

export const plugin = createPiAiProviderPlugin({
  id: "minimax",
  label: "MiniMax",
  auth: "apiKey"
});
