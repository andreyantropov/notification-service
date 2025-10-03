import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";
import { SendNotificationUseCaseDependencies } from "./interfaces/SendNotificationUseCaseDependencies.js";
import { Notification } from "../../../domain/types/Notification.js";

export const createSendNotificationUseCase = (
  dependencies: SendNotificationUseCaseDependencies,
): SendNotificationUseCase => {
  const { buffer, notificationDeliveryService } = dependencies;

  const send = async (
    notification: Notification | Notification[],
  ): Promise<void> => {
    const notifications = Array.isArray(notification)
      ? notification
      : [notification];

    if (notifications.length === 0) {
      return;
    }

    const urgentNotifications = notifications.filter((n) => n.isUrgent);
    const unurgentNotifications = notifications.filter((n) => !n.isUrgent);

    if (urgentNotifications.length > 0) {
      await notificationDeliveryService.send(urgentNotifications);
    }

    if (unurgentNotifications.length > 0) {
      await buffer.append(unurgentNotifications);
    }
  };

  const checkHealth = notificationDeliveryService.checkHealth
    ? async (): Promise<void> => {
        await notificationDeliveryService.checkHealth?.();
      }
    : undefined;

  return {
    send,
    ...(checkHealth ? { checkHealth } : {}),
  };
};
