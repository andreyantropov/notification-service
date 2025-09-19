import { z } from "zod";

import { LocalFileLoggerConfig } from "../infrastructure/loggers/createLocalFileLogger/index.js";

const localFileConfigSchema = z.object({
  logsDir: z.string().min(1, "logsDir не может быть пустым").default("logs"),
});

export const localFileConfig: LocalFileLoggerConfig =
  localFileConfigSchema.parse({
    logsDir: process.env.LOGS_DIR,
  });
