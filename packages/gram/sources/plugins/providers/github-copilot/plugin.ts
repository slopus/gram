import { createPiAiProviderPlugin } from "../_common/pi-ai-provider/plugin.js";

export const plugin = createPiAiProviderPlugin({
  id: "github-copilot",
  label: "GitHub Copilot",
  auth: "oauth"
});
