import { LoggedServerDependencies } from "./interfaces/index.js";
import { EventType } from "../../../../application/enums/index.js";
import { Server } from "../../interfaces/index.js";

export const createLoggedServer = (
  dependencies: LoggedServerDependencies,
): Server => {
  const { server, logger } = dependencies;

  const start = async (): Promise<void> => {
    const start = Date.now();
    try {
      await server.start();
      const duration = Date.now() - start;
      logger.debug({
        message: "Сервер успешно запущен",
        eventType: EventType.Bootstrap,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({
        message: "Не удалось запустить сервер",
        eventType: EventType.Bootstrap,
        duration,
        error,
      });
      throw error;
    }
  };

  const shutdown = async (): Promise<void> => {
    const start = Date.now();
    try {
      await server.shutdown();
      const duration = Date.now() - start;
      logger.debug({
        message: "Сервер успешно остановлен",
        eventType: EventType.Shutdown,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({
        message: "Не удалось остановить сервер",
        eventType: EventType.Shutdown,
        duration,
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
