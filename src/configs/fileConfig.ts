import { z } from "zod";

import { FileLoggerConfig } from "../infrastructure/telemetry/logging/createFileLogger/index.js";

const localFileConfigSchema = z.object({
  logsDir: z.string().min(1, "logsDir не может быть пустым").default("logs"),
});

export const localFileConfig: FileLoggerConfig = localFileConfigSchema.parse({
  logsDir: process.env.LOGS_DIR,
});
