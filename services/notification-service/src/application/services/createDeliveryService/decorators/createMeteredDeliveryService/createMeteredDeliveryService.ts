import {
  DEFAULT_SUBJECT,
  DEFAULT_STRATEGY,
  DEFAULT_IS_IMMEDIATE,
  NOTIFICATIONS_PROCESSED_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_STATUS_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_SUBJECT_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_STRATEGY_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL,
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
      meter.increment(NOTIFICATIONS_PROCESSED_BY_STATUS_TOTAL, { status });

      const subjectId = notification.subject?.id ?? DEFAULT_SUBJECT;
      meter.increment(NOTIFICATIONS_PROCESSED_BY_SUBJECT_TOTAL, { subjectId });

      const strategy = notification.strategy ?? DEFAULT_STRATEGY;
      meter.increment(NOTIFICATIONS_PROCESSED_BY_STRATEGY_TOTAL, { strategy });

      const isImmediate = notification.isImmediate ?? DEFAULT_IS_IMMEDIATE;
      meter.increment(NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL, { isImmediate: isImmediate ? "true" : "false" });
    }

    return results;
  };

  return {
    send,
    checkHealth: deliveryService.checkHealth,
  };
};
