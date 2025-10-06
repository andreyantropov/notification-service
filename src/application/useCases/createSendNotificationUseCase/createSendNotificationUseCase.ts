import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";
import { SendNotificationUseCaseDependencies } from "./interfaces/SendNotificationUseCaseDependencies.js";
import { Notification } from "../../../domain/types/Notification.js";
import { RawNotification } from "../../types/RawNotification.js";

export const createSendNotificationUseCase = (
  dependencies: SendNotificationUseCaseDependencies,
): SendNotificationUseCase => {
  const { buffer, notificationDeliveryService, idGenerator } = dependencies;

  const send = async (
    rawNotifications: RawNotification | RawNotification[],
  ): Promise<Notification[]> => {
    const rawNotificationsArray = Array.isArray(rawNotifications)
      ? rawNotifications
      : [rawNotifications];

    const notifications = rawNotificationsArray.map((rawNotification) => ({
      id: idGenerator(),
      ...rawNotification,
    }));

    const urgentNotifications = notifications.filter((n) => n.isUrgent);
    const unurgentNotifications = notifications.filter((n) => !n.isUrgent);

    if (urgentNotifications.length > 0) {
      await notificationDeliveryService.send(urgentNotifications);
    }

    if (unurgentNotifications.length > 0) {
      await buffer.append(unurgentNotifications);
    }

    return notifications;
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
