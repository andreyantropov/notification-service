import type { LoggedProducerDependencies } from "./interfaces/index.js";
import { EventType } from "@notification-platform/shared";
import type { Producer } from "@notification-platform/shared";

export const createLoggedProducer = <T>(
  dependencies: LoggedProducerDependencies<T>,
): Producer<T> => {
  const { producer, logger } = dependencies;

  const start = async (): Promise<void> => {
    const startTs = Date.now();
    try {
      await producer.start();
      const durationMs = Date.now() - startTs;
      logger.debug({
        message: "Producer успешно запущен",
        eventType: EventType.Bootstrap,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - startTs;
      logger.critical({
        message: "Не удалось запустить producer",
        eventType: EventType.Bootstrap,
        durationMs,
        error,
      });
      throw error;
    }
  };

  const publish = async (items: readonly T[]): Promise<void> => {
    const startTs = Date.now();
    try {
      await producer.publish(items);
      const durationMs = Date.now() - startTs;
      logger.debug({
        message: `${items.length} сообщений опубликовано в очередь`,
        eventType: EventType.MessagePublish,
        durationMs,
        details: {
          count: items.length,
        },
      });
    } catch (error) {
      const durationMs = Date.now() - startTs;
      logger.error({
        message: "Не удалось опубликовать сообщения",
        eventType: EventType.MessagePublish,
        durationMs,
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
      const durationMs = Date.now() - startTs;
      logger.debug({
        message: "Producer успешно остановлен",
        eventType: EventType.Shutdown,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - startTs;
      logger.warning({
        message: "Ошибка при остановке producer",
        eventType: EventType.Shutdown,
        durationMs,
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
        const durationMs = Date.now() - startTs;
        logger.debug({
          message: "Producer готов к работе",
          eventType: EventType.HealthCheck,
          durationMs,
        });
      } catch (error) {
        const durationMs = Date.now() - startTs;
        logger.error({
          message: "Producer недоступен",
          eventType: EventType.HealthCheck,
          durationMs,
          error,
        });
        throw error;
      }
    }
    : undefined;

  return { start, publish, shutdown, checkHealth };
};
