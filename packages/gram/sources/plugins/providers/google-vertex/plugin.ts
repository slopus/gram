import { createPiAiProviderPlugin } from "../_common/pi-ai-provider/plugin.js";

export const plugin = createPiAiProviderPlugin({
  id: "google-vertex",
  label: "Vertex AI",
  auth: "none"
});
