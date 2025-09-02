import { z } from "zod";
import { LocalFileLoggerConfig } from "../infrastructure/loggers/createLocalFileLogger/index.js";

const localFileConfigSchema = z.object({
  logsDir: z.string().optional().default("logs"),
});

export const localFileConfig: LocalFileLoggerConfig =
  localFileConfigSchema.parse({
    logsDir: process.env.LOGS_DIR,
  });
