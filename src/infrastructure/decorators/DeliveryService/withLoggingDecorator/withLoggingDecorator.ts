import { type DeliveryService } from "../../../../application/services/index.js";
import { type Notification } from "../../../../domain/types/index.js";
import { EVENT_TYPE, TRIGGER_TYPE } from "../../../telemetry/index.js";

import { type LoggingDecoratorDependencies } from "./interfaces/index.js";

export const withLoggingDecorator = (
  dependencies: LoggingDecoratorDependencies,
): DeliveryService => {
  const { deliveryService, logger } = dependencies;

  const deliver = async (notification: Notification): Promise<void> => {
    const start = Date.now();
    let error: unknown;

    try {
      await deliveryService.deliver(notification);
    } catch (err) {
      error = err;

      throw err;
    } finally {
      const durationMs = Date.now() - start;
      const isSuccess = !error;

      const log = {
        message: isSuccess
          ? `Уведомление успешно доставлено стратегией ${notification.strategy}`
          : `Не удалось доставить уведомление стратегией ${notification.strategy}`,
        eventName: "notification.deliver",
        eventType: EVENT_TYPE.MESSAGING,
        trigger: TRIGGER_TYPE.API,
        durationMs,
        details: { id: notification.id, strategy: notification.strategy },
        ...(error ? { error } : {}),
      };

      if (isSuccess) {
        logger.info(log);
      } else {
        logger.error(log);
      }
    }
  };

  return { ...deliveryService, deliver };
};
