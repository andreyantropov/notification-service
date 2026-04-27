import { type Server } from "../../../http/server/index.js";
import { EVENT_TYPE, TRIGGER_TYPE } from "../../../telemetry/index.js";

import { type LoggingDependencies } from "./interfaces/index.js";

export const withLogging = (dependencies: LoggingDependencies): Server => {
  const { server, logger } = dependencies;

  const start = async (): Promise<void> => {
    const start = Date.now();
    let error: unknown;

    try {
      await server.start();
    } catch (err) {
      error = err;

      throw err;
    } finally {
      const durationMs = Date.now() - start;
      const isSuccess = !error;

      const log = {
        message: isSuccess
          ? "Сервер успешно запущен"
          : "Не удалось запустить сервер",
        eventName: "server.start",
        eventType: EVENT_TYPE.LIFECYCLE,
        trigger: TRIGGER_TYPE.MANUAL,
        durationMs,
        ...(error ? { error } : {}),
      };

      if (isSuccess) {
        logger.debug(log);
      } else {
        logger.fatal(log);
      }
    }
  };

  const shutdown = async (): Promise<void> => {
    const startTime = Date.now();
    let error: unknown;

    try {
      await server.shutdown();
    } catch (err) {
      error = err;

      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      const isSuccess = !error;

      const log = {
        message: isSuccess
          ? "Сервер успешно остановлен"
          : "Не удалось остановить сервер",
        eventName: "server.shutdown",
        eventType: EVENT_TYPE.LIFECYCLE,
        trigger: TRIGGER_TYPE.MANUAL,
        durationMs,
        ...(error ? { error } : {}),
      };

      if (isSuccess) {
        logger.debug(log);
      } else {
        logger.fatal(log);
      }
    }
  };

  return { ...server, start, shutdown };
};
