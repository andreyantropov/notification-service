import { HandleIncomingNotificationsUseCase } from "./interfaces/HandleIncomingNotificationsUseCase.js";
import { HandleIncomingNotificationsUseCaseDependencies } from "./interfaces/index.js";
import { Notification } from "../../../domain/types/index.js";
import { IncomingNotification } from "../../types/index.js";

export const createHandleIncomingNotificationsUseCase = (
  dependencies: HandleIncomingNotificationsUseCaseDependencies,
): HandleIncomingNotificationsUseCase => {
  const { producer, notificationDeliveryService, idGenerator } = dependencies;

  const handle = async (
    incomingNotifications: readonly IncomingNotification[],
  ): Promise<Notification[]> => {
    const notifications = incomingNotifications.map((incomingNotification) => ({
      id: idGenerator(),
      createdAt: new Date().toISOString(),
      ...incomingNotification,
    }));

    const urgentNotifications: Notification[] = [];
    const unurgentNotifications: Notification[] = [];

    for (const n of notifications) {
      if (n.isImmediate) {
        urgentNotifications.push(n);
      } else {
        unurgentNotifications.push(n);
      }
    }

    if (unurgentNotifications.length > 0) {
      await producer.publish(unurgentNotifications);
    }

    if (urgentNotifications.length > 0) {
      const deliveryResults =
        await notificationDeliveryService.send(urgentNotifications);
      const notificationsToRetry = deliveryResults
        .filter((result) => !result.success)
        .map((result) => result.notification);

      if (notificationsToRetry.length > 0) {
        await producer.publish(notificationsToRetry);
      }
    }

    return notifications;
  };

  return {
    handle,
  };
};
