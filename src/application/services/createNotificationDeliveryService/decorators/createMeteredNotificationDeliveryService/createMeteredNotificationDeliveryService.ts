import { MeteredNotificationDeliveryServiceDependencies } from "./interfaces/index.js";
import {
  Notification,
  DELIVERY_STRATEGIES,
} from "../../../../../domain/types/index.js";
import {
  NotificationDeliveryService,
  DeliveryResult,
} from "../../interfaces/index.js";

const DEFAULT_STRATEGY = DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE;
const DEFAULT_SUBJECT = "unknown";

export const createMeteredNotificationDeliveryService = (
  dependencies: MeteredNotificationDeliveryServiceDependencies,
): NotificationDeliveryService => {
  const { notificationDeliveryService, meter } = dependencies;

  const send = async (
    notifications: readonly Notification[],
  ): Promise<DeliveryResult[]> => {
    try {
      const results = await notificationDeliveryService.send(notifications);

      for (const result of results) {
        const { notification, success } = result;
        const subjectId = notification.subject?.id ?? DEFAULT_SUBJECT;
        const strategy = notification.strategy ?? DEFAULT_STRATEGY;
        const isImmediate = notification.isImmediate ?? false;

        meter.incrementTotalNotifications();
        meter.incrementNotificationsProcessedByResult(
          success ? "success" : "failure",
        );
        meter.incrementNotificationsProcessedBySubject(subjectId);
        meter.incrementNotificationsProcessedByStrategy(strategy);
        meter.incrementNotificationsByPriority(isImmediate);
      }

      return results;
    } catch (error) {
      for (const notification of notifications) {
        const subjectId = notification.subject?.id ?? DEFAULT_SUBJECT;
        const strategy = notification.strategy ?? DEFAULT_STRATEGY;
        const isImmediate = notification.isImmediate ?? false;

        meter.incrementTotalNotifications();
        meter.incrementNotificationsProcessedByResult("failure");
        meter.incrementNotificationsProcessedBySubject(subjectId);
        meter.incrementNotificationsProcessedByStrategy(strategy);
        meter.incrementNotificationsByPriority(isImmediate);
      }

      throw error;
    }
  };

  return {
    send,
    checkHealth: notificationDeliveryService.checkHealth,
  };
};
