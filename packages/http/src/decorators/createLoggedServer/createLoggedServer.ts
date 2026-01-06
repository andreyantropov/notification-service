import type { LoggedServerDependencies } from "./interfaces/index.js";
import { EventType } from "@notification-platform/shared";
import type { Server } from "@notification-platform/shared";

export const createLoggedServer = (
  dependencies: LoggedServerDependencies,
): Server => {
  const { server, logger } = dependencies;

  const start = async (): Promise<void> => {
    const start = Date.now();
    try {
      await server.start();
      const durationMs = Date.now() - start;
      logger.debug({
        message: "Сервер успешно запущен",
        eventType: EventType.Bootstrap,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - start;
      logger.critical({
        message: "Не удалось запустить сервер",
        eventType: EventType.Bootstrap,
        durationMs,
        error,
      });
      throw error;
    }
  };

  const shutdown = async (): Promise<void> => {
    const start = Date.now();
    try {
      await server.shutdown();
      const durationMs = Date.now() - start;
      logger.debug({
        message: "Сервер успешно остановлен",
        eventType: EventType.Shutdown,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - start;
      logger.error({
        message: "Не удалось остановить сервер",
        eventType: EventType.Shutdown,
        durationMs,
        error,
      });
      throw error;
    }
  };

  return {
    start,
    shutdown,
  };
};
