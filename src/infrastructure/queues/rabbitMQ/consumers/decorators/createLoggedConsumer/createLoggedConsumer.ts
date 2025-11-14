import { LoggedConsumerDependencies } from "./interfaces/LoggedConsumerDependencies.js";
import { EventType } from "../../../../../../application/enums/index.js";
import { Consumer } from "../../../../../../application/ports/Consumer.js";

export const createLoggedConsumer = (
  dependencies: LoggedConsumerDependencies,
): Consumer => {
  const { consumer, logger } = dependencies;

  const start = async (): Promise<void> => {
    const startTs = Date.now();

    try {
      await consumer.start();
      const duration = Date.now() - startTs;
      logger.debug({
        message: "Consumer успешно запущен",
        eventType: EventType.Bootstrap,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTs;
      logger.error({
        message: "Не удалось запустить consumer",
        eventType: EventType.Bootstrap,
        duration,
        error,
      });
      throw error;
    }
  };

  const shutdown = async (): Promise<void> => {
    const startTs = Date.now();
    try {
      await consumer.shutdown();
      const duration = Date.now() - startTs;
      logger.debug({
        message: "Consumer успешно остановлен",
        eventType: EventType.Shutdown,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTs;
      logger.warning({
        message: "Ошибка при остановке consumer",
        eventType: EventType.Shutdown,
        duration,
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
          const duration = Date.now() - startTs;
          logger.debug({
            message: "Consumer готов к работе",
            eventType: EventType.HealthCheck,
            duration,
          });
        } catch (error) {
          const duration = Date.now() - startTs;
          logger.error({
            message: "Consumer недоступен",
            eventType: EventType.HealthCheck,
            duration,
            error,
          });
          throw error;
        }
      }
    : undefined;

  return { start, shutdown, checkHealth };
};
