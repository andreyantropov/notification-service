import { z } from "zod";
import { LocalFileLoggerConfig } from "../shared/infrastructure/loggers/createLocalFileLogger/interfaces/LocalFileLoggerConfig.js";

const localFileConfigSchema = z.object({
  logsDir: z.string().optional().default("logs"),
});

export const localFileConfig: LocalFileLoggerConfig =
  localFileConfigSchema.parse({
    logsDir: process.env.LOGS_DIR,
  });
