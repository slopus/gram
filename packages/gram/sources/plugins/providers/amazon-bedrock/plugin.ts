import { createPiAiProviderPlugin } from "../_common/pi-ai-provider/plugin.js";

export const plugin = createPiAiProviderPlugin({
  id: "amazon-bedrock",
  label: "Amazon Bedrock",
  auth: "none"
});
