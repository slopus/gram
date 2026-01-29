import { intro, outro } from "@clack/prompts";

export function statusCommand(): void {
  intro("scout status");
  console.log("No running bot (placeholder).");
  outro("Done.");
}
