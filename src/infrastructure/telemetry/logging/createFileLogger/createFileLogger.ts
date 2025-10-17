import { promises as fs } from "fs";
import path from "path";

import { FileLoggerConfig } from "./interfaces/FileLoggerConfig.js";
import { LogLevel } from "../enums/LogLevel.js";
import { Log } from "../interfaces/Log.js";
import { Logger } from "../interfaces/Logger.js";

const LOGS_DIR_NAME = "logs";

export const createFileLogger = (config: FileLoggerConfig): Logger => {
  const { logsDir } = config;

  const logDir = path.join(logsDir ?? process.cwd(), LOGS_DIR_NAME);

  const ensureLogDirectoryExists = async (): Promise<void> => {
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "EEXIST"
      ) {
        return;
      }
      throw new Error("Не удалось создать директорию:", { cause: error });
    }
  };

  const getLogFileName = (level: LogLevel, timestamp: Date): string => {
    const dateStr = timestamp.getTime();
    return `${level}-${dateStr}.log`;
  };

  const writeLog = async (log: Log): Promise<void> => {
    try {
      await ensureLogDirectoryExists();
      const fileName = getLogFileName(log.level, new Date());
      const filePath = path.join(logDir, fileName);

      await fs.writeFile(filePath, JSON.stringify(log, null, 2));
    } catch (error) {
      throw new Error("Не удалось записать данные в локальный файл", {
        cause: error,
      });
    }
  };

  return {
    writeLog,
  };
};
