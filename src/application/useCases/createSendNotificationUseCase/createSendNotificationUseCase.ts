import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";
import { SendNotificationUseCaseDependencies } from "./interfaces/SendNotificationUseCaseDependencies.js";
import { Notification } from "../../../domain/types/Notification.js";

export const createSendNotificationUseCase = (
  dependencies: SendNotificationUseCaseDependencies,
): SendNotificationUseCase => {
  const { buffer, notificationDeliveryService } = dependencies;

  const sendUrgentNotifications = async (
    urgentNotifications: Notification[],
  ): Promise<void> => {
    await notificationDeliveryService.send(urgentNotifications);
  };

  const enqueueUnurgentNotifications = async (
    bufferedNotifications: Notification[],
  ) => {
    await buffer.append(bufferedNotifications);
  };

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
      await sendUrgentNotifications(urgentNotifications);
    }

    if (unurgentNotifications.length > 0) {
      await enqueueUnurgentNotifications(unurgentNotifications);
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
