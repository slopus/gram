import { intro, outro } from "@clack/prompts";

import { loadPlugin, unloadPlugin } from "../engine/client.js";

export async function loadPluginCommand(id: string): Promise<void> {
  intro("scout plugins");
  await loadPlugin(id);
  outro(`Loaded plugin ${id}.`);
}

export async function unloadPluginCommand(id: string): Promise<void> {
  intro("scout plugins");
  await unloadPlugin(id);
  outro(`Unloaded plugin ${id}.`);
}
