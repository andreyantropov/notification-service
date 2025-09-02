import { Logger } from "../../ports/Logger.js";
import { Log } from "../../types/Log.js";
import { FallbackLoggerClientConfig } from "./interfaces/FallbackLoggerConfig.js";

export const createFallbackLogger = (
  loggers: Logger[],
  config?: FallbackLoggerClientConfig,
): Logger => {
  const { onError = () => {} } = config || {};

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
          new Error(
            `Ошибка записи лога через логгер ${logger.constructor.name}`,
            { cause: error },
          ),
        );
      }
    }

    throw new Error("Не удалось записать лог ни одним из логгеров");
  };

  return {
    writeLog,
  };
};
