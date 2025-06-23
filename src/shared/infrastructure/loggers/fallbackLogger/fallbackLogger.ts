import { Log } from "../../../interfaces/Log.js";
import { Logger } from "../../../interfaces/Logger.js";
import { FallbackLoggerClientConfig } from "./interfaces/FallbackLoggerConfig.js";

export const createFallbackLogger = ({
  loggers,
  onError = () => {},
}: FallbackLoggerClientConfig): Logger => {
  if (loggers.length === 0) {
    throw new Error("Не указано ни одного логгера");
  }

  const writeLog = async (log: Log) => {
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
