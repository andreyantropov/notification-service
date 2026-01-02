import {
  DEFAULT_SUBJECT,
  DEFAULT_STRATEGY,
  DEFAULT_IS_IMMEDIATE,
} from "./constants/index.js";
import type { MeteredDeliveryServiceDependencies } from "./interfaces/index.js";
import type { Notification } from "../../../../../domain/types/index.js";
import type { DeliveryService, Result } from "../../interfaces/index.js";

export const createMeteredDeliveryService = (
  dependencies: MeteredDeliveryServiceDependencies,
): DeliveryService => {
  const { deliveryService, meter } = dependencies;

  const send = async (
    notifications: readonly Notification[],
  ): Promise<Result[]> => {
    const results = await deliveryService.send(notifications);

    for (const result of results) {
      meter.incrementNotificationsProcessedTotal();

      const { notification, status } = result;
      meter.incrementNotificationsProcessedByResult(status);

      const subjectId = notification.subject?.id ?? DEFAULT_SUBJECT;
      meter.incrementNotificationsProcessedBySubject(subjectId);

      const strategy = notification.strategy ?? DEFAULT_STRATEGY;
      meter.incrementNotificationsProcessedByStrategy(strategy);

      const isImmediate = notification.isImmediate ?? DEFAULT_IS_IMMEDIATE;
      meter.incrementNotificationsProcessedByPriority(isImmediate);
    }

    return results;
  };

  return {
    send,
    checkHealth: deliveryService.checkHealth,
  };
};
