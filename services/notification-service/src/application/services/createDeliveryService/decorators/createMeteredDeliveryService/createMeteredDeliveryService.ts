import {
  DEFAULT_SUBJECT,
  DEFAULT_STRATEGY,
  DEFAULT_IS_IMMEDIATE,
  NOTIFICATIONS_PROCESSED_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_STATUS,
  NOTIFICATIONS_PROCESSED_BY_SUBJECT,
  NOTIFICATIONS_PROCESSED_BY_STRATEGY,
  NOTIFICATIONS_PROCESSED_BY_PRIORITY,
} from "./constants/index.js";
import type { MeteredDeliveryServiceDependencies } from "./interfaces/index.js";
import type { Notification } from "@notification-platform/shared";
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
      meter.increment(NOTIFICATIONS_PROCESSED_TOTAL);

      const { notification, status } = result;
      meter.increment(NOTIFICATIONS_PROCESSED_BY_STATUS, { status });

      const subjectId = notification.subject?.id ?? DEFAULT_SUBJECT;
      meter.increment(NOTIFICATIONS_PROCESSED_BY_SUBJECT, { subjectId });

      const strategy = notification.strategy ?? DEFAULT_STRATEGY;
      meter.increment(NOTIFICATIONS_PROCESSED_BY_STRATEGY, { strategy });

      const isImmediate = notification.isImmediate ?? DEFAULT_IS_IMMEDIATE;
      meter.increment(NOTIFICATIONS_PROCESSED_BY_PRIORITY, { isImmediate: isImmediate ? "true" : "false" });
    }

    return results;
  };

  return {
    send,
    checkHealth: deliveryService.checkHealth,
  };
};
