import { LoggedProducerDependencies } from "./interfaces/LoggedProducerDependencies.js";
import { EventType } from "../../../../../../application/enums/index.js";
import { Producer } from "../../../../../../application/ports/Producer.js";

export const createLoggedProducer = <T>(
  dependencies: LoggedProducerDependencies<T>,
): Producer<T> => {
  const { producer, logger } = dependencies;

  const start = async (): Promise<void> => {
    const startTs = Date.now();
    try {
      await producer.start();
      const duration = Date.now() - startTs;
      logger.debug({
        message: "Producer успешно запущен",
        eventType: EventType.Bootstrap,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTs;
      logger.error({
        message: "Не удалось запустить producer",
        eventType: EventType.Bootstrap,
        duration,
        error,
      });
      throw error;
    }
  };

  const publish = async (items: T[]): Promise<void> => {
    const startTs = Date.now();
    try {
      await producer.publish(items);
      const duration = Date.now() - startTs;
      logger.debug({
        message: `${items.length} сообщений опубликовано в очередь`,
        eventType: EventType.MessagePublish,
        duration,
        details: {
          count: items.length,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTs;
      logger.error({
        message: "Не удалось опубликовать сообщения",
        eventType: EventType.MessagePublish,
        duration,
        details: { count: items.length },
        error,
      });
      throw error;
    }
  };

  const shutdown = async (): Promise<void> => {
    const startTs = Date.now();
    try {
      await producer.shutdown();
      const duration = Date.now() - startTs;
      logger.debug({
        message: "Producer успешно остановлен",
        eventType: EventType.Shutdown,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTs;
      logger.warning({
        message: "Ошибка при остановке producer",
        eventType: EventType.Shutdown,
        duration,
        error,
      });
      throw error;
    }
  };

  const checkHealth = producer.checkHealth
    ? async (): Promise<void> => {
        const startTs = Date.now();
        try {
          await producer.checkHealth!();
          const duration = Date.now() - startTs;
          logger.debug({
            message: "Producer готов к работе",
            eventType: EventType.HealthCheck,
            duration,
          });
        } catch (error) {
          const duration = Date.now() - startTs;
          logger.error({
            message: "Producer недоступен",
            eventType: EventType.HealthCheck,
            duration,
            error,
          });
          throw error;
        }
      }
    : undefined;

  return { start, publish, shutdown, checkHealth };
};
