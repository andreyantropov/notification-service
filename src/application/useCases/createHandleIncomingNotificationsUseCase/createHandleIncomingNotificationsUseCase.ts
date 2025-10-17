import { HandleIncomingNotificationsUseCase } from "./interfaces/HandleIncomingNotificationsUseCase.js";
import { HandleIncomingNotificationsUseCaseDependencies } from "./interfaces/HandleIncomingNotificationsUseCaseDependencies.js";
import { Notification } from "../../../domain/types/Notification.js";
import { IncomingNotification } from "../../types/IncomingNotification.js";

export const createHandleIncomingNotificationsUseCase = (
  dependencies: HandleIncomingNotificationsUseCaseDependencies,
): HandleIncomingNotificationsUseCase => {
  const { buffer, notificationDeliveryService, idGenerator } = dependencies;

  const handle = async (
    incomingNotifications: IncomingNotification[],
  ): Promise<Notification[]> => {
    const notifications = incomingNotifications.map((incomingNotification) => ({
      id: idGenerator(),
      ...incomingNotification,
    }));

    const urgentNotifications = notifications.filter((n) => n.isImmediate);
    const unurgentNotifications = notifications.filter((n) => !n.isImmediate);

    if (urgentNotifications.length > 0) {
      await notificationDeliveryService.send(urgentNotifications);
    }

    if (unurgentNotifications.length > 0) {
      await buffer.append(unurgentNotifications);
    }

    return notifications;
  };

  return {
    handle,
  };
};
