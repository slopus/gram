import { confirm, intro, isCancel, outro, spinner } from "@clack/prompts";
import { promises as fs } from "node:fs";
import path from "node:path";
import pino from "pino";

import { TelegramConnector } from "../connectors/telegram.js";
import type {
  Connector,
  ConnectorMessage,
  MessageContext
} from "../connectors/types.js";

const logger = pino();

export type StartOptions = {
  config: string;
};

type TelegramConfig = {
  token: string;
  polling?: boolean;
  statePath?: string | null;
  retry?: {
    minDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
    jitter?: number;
  };
  enableGracefulShutdown?: boolean;
};

type ScoutConfig = {
  connectors?: {
    telegram?: TelegramConfig;
  };
};

const DEFAULT_TELEGRAM_CONFIG_PATH = ".scout/telegram.json";

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
  task.start("Loading configuration");

  const configPath = path.resolve(options.config);
  const config = (await readJsonFile<ScoutConfig>(configPath)) ?? {};
  const telegramFallback = await readJsonFile<TelegramConfig>(
    path.resolve(DEFAULT_TELEGRAM_CONFIG_PATH)
  );

  const connectors: { name: string; connector: Connector }[] = [];

  const telegramConfig =
    config.connectors?.telegram ?? telegramFallback ?? null;

  if (telegramConfig?.token) {
    connectors.push({
      name: "telegram",
      connector: new TelegramConnector(telegramConfig)
    });
  }

  task.stop("Connectors initialized");

  if (connectors.length === 0) {
    logger.warn({ config: configPath }, "No connectors configured");
    outro("No connectors configured. Exiting.");
    return;
  }

  for (const { name, connector } of connectors) {
    connector.onMessage((message: ConnectorMessage, context: MessageContext) =>
      echoHandler(connector, message, context, name)
    );
  }

  logger.info(
    { connectors: connectors.map((entry) => entry.name) },
    "Bot started"
  );
  outro("Ready. Listening for messages.");
}

async function echoHandler(
  connector: Connector,
  message: ConnectorMessage,
  context: MessageContext,
  name: string
): Promise<void> {
  if (!message.text) {
    return;
  }

  try {
    await connector.sendMessage(context.channelId, { text: message.text });
  } catch (error) {
    logger.warn({ connector: name, error }, "Failed to echo message");
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
