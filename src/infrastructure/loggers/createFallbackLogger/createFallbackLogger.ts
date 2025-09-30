import { FallbackLoggerClientConfig } from "./interfaces/FallbackLoggerConfig.js";
import { FallbackLoggerDependencies } from "./interfaces/FallbackLoggerDependencies.js";
import { DEFAULT_CONFIG } from "../../../shared/constants/defaults.js";
import { noop } from "../../../shared/utils/noop/noop.js";
import { Logger } from "../../ports/Logger.js";
import { Log } from "../../types/Log.js";

export const createFallbackLogger = (
  dependencies: FallbackLoggerDependencies,
  config: FallbackLoggerClientConfig = DEFAULT_CONFIG,
): Logger => {
  const { loggers } = dependencies;
  const { onError = noop } = config;

  if (loggers.length === 0) {
    throw new Error("Не указано ни одного логгера");
  }

  const writeLog = async (log: Log): Promise<void> => {
    for (const logger of loggers) {
      try {
        await logger.writeLog(log);
        return;
      } catch (error) {
        onError(
          log,
          new Error(`Ошибка записи лога в цепочке Fallback`, {
            cause: error,
          }),
        );
      }
    }

    throw new Error("Не удалось записать лог ни одним из логгеров");
  };

  return {
    writeLog,
  };
};
