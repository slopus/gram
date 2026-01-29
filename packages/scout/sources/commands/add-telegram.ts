import { confirm, intro, isCancel, outro, password } from "@clack/prompts";
import path from "node:path";

import { readAuthFile, writeAuthFile } from "../auth.js";

export type AddTelegramOptions = {
  token?: string;
  output: string;
};

const DEFAULT_OUTPUT = ".scout/auth.json";

export async function addTelegramCommand(
  options: AddTelegramOptions
): Promise<void> {
  intro("scout add telegram");

  const outputPath = path.resolve(options.output || DEFAULT_OUTPUT);

  const tokenInput =
    options.token ??
    (await password({
      message: "Telegram bot token",
      validate: (value) => (value ? undefined : "Token is required")
    }));

  if (isCancel(tokenInput)) {
    outro("Canceled.");
    return;
  }

  const token = String(tokenInput);

  const auth = await readAuthFile(outputPath);

  if (auth.telegram?.token) {
    const overwrite = await confirm({
      message: `Overwrite existing telegram token in ${outputPath}?`,
      initialValue: false
    });

    if (isCancel(overwrite) || overwrite === false) {
      outro("Canceled.");
      return;
    }
  }

  auth.telegram = { token };
  await writeAuthFile(outputPath, auth);

  outro(`Saved telegram token to ${outputPath}`);
}
