import { confirm, intro, isCancel, outro, spinner } from "@clack/prompts";
import pino from "pino";

const logger = pino();

export type StartOptions = {
  config: string;
};

export async function startCommand(options: StartOptions): Promise<void> {
  intro("scout start");

  const proceed = await confirm({
    message: `Start bot with config ${options.config}?`,
    initialValue: true
  });

  if (isCancel(proceed) || proceed === false) {
    outro("Canceled.");
    return;
  }

  const task = spinner();
  task.start("Launching bot");

  await new Promise((resolve) => setTimeout(resolve, 300));

  task.stop("Bot launched (placeholder)");
  logger.info({ config: options.config }, "Bot started");
  outro("Ready.");
}
