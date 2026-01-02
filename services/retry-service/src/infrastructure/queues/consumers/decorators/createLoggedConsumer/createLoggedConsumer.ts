import type { LoggedConsumerDependencies } from "./interfaces/index.js";
import { EventType } from "../../../../../application/enums/index.js";
import type { Consumer } from "../../../../../application/ports/index.js";

export const createLoggedConsumer = (
  dependencies: LoggedConsumerDependencies,
): Consumer => {
  const { consumer, logger } = dependencies;

  const start = async (): Promise<void> => {
    const startTs = Date.now();

    try {
      await consumer.start();
      const durationMs = Date.now() - startTs;
      logger.debug({
        message: "Consumer успешно запущен",
        eventType: EventType.Bootstrap,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - startTs;
      logger.critical({
        message: "Не удалось запустить consumer",
        eventType: EventType.Bootstrap,
        durationMs,
        error,
      });
      throw error;
    }
  };

  const shutdown = async (): Promise<void> => {
    const startTs = Date.now();
    try {
      await consumer.shutdown();
      const durationMs = Date.now() - startTs;
      logger.debug({
        message: "Consumer успешно остановлен",
        eventType: EventType.Shutdown,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - startTs;
      logger.warning({
        message: "Ошибка при остановке consumer",
        eventType: EventType.Shutdown,
        durationMs,
        error,
      });
      throw error;
    }
  };

  const checkHealth = consumer.checkHealth
    ? async (): Promise<void> => {
        const startTs = Date.now();
        try {
          await consumer.checkHealth!();
          const durationMs = Date.now() - startTs;
          logger.debug({
            message: "Consumer готов к работе",
            eventType: EventType.HealthCheck,
            durationMs,
          });
        } catch (error) {
          const durationMs = Date.now() - startTs;
          logger.error({
            message: "Consumer недоступен",
            eventType: EventType.HealthCheck,
            durationMs,
            error,
          });
          throw error;
        }
      }
    : undefined;

  return { start, shutdown, checkHealth };
};
