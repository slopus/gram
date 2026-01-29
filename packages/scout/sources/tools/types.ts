import type { Tool, ToolResultMessage } from "@mariozechner/pi-ai";
import type { TSchema } from "@sinclair/typebox";

import type { FileReference } from "../files/types.js";
import type { MessageContext } from "../connectors/types.js";
import type { ConnectorRegistry } from "../connectors/registry.js";
import type { FileStore } from "../files/store.js";
import type { MemoryEngine } from "../memory/engine.js";
import type { Session } from "../sessions/session.js";
import type { SecretsStore } from "../secrets/store.js";
import type { Logger } from "pino";

export type ToolExecutionContext<State = Record<string, unknown>> = {
  connectorRegistry: ConnectorRegistry | null;
  fileStore: FileStore;
  memory: MemoryEngine | null;
  secrets: SecretsStore;
  logger: Logger;
  session: Session<State>;
  source: string;
  messageContext: MessageContext;
};

export type ToolExecutionResult = {
  toolMessage: ToolResultMessage;
  files?: FileReference[];
};

export type ToolDefinition<TParams extends TSchema = TSchema> = {
  tool: Tool<TParams>;
  execute: (
    args: unknown,
    context: ToolExecutionContext,
    toolCall: { id: string; name: string }
  ) => Promise<ToolExecutionResult>;
};
