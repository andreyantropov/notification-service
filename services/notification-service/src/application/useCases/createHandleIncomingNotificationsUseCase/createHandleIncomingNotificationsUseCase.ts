import type { HandleIncomingNotificationsUseCase } from "./interfaces/HandleIncomingNotificationsUseCase.js";
import type {
  CategorizedNotifications,
  HandleIncomingNotificationsUseCaseDependencies,
} from "./interfaces/index.js";
import type { Notification, Subject } from "@notification-platform/shared";
import type { IncomingNotification } from "../../types/index.js";

export const createHandleIncomingNotificationsUseCase = (
  dependencies: HandleIncomingNotificationsUseCaseDependencies,
): HandleIncomingNotificationsUseCase => {
  const { producer, deliveryService, idGenerator } = dependencies;

  const enrichNotification = (
    incoming: IncomingNotification,
    subject?: Subject,
  ): Notification => ({
    id: idGenerator(),
    createdAt: new Date().toISOString(),
    ...incoming,
    ...(subject && { subject }),
  });

  const categorizeNotifications = (
    notifications: readonly Notification[],
  ): CategorizedNotifications => {
    const immediate: Notification[] = [];
    const nonImmediate: Notification[] = [];

    for (const notification of notifications) {
      if (notification.isImmediate) {
        immediate.push(notification);
      } else {
        nonImmediate.push(notification);
      }
    }

    return { immediate, nonImmediate };
  };

  const sendImmediateNotifications = async (
    notifications: readonly Notification[],
  ): Promise<void> => {
    if (notifications.length === 0) {
      return;
    }

    const deliveryResults = await deliveryService.send(notifications);
    const failedNotifications = deliveryResults
      .filter((result) => result.status === "failure")
      .map((result) => result.notification);

    if (failedNotifications.length > 0) {
      await producer.publish(failedNotifications);
    }
  };

  const sendNonImmediateNotifications = async (
    notifications: readonly Notification[],
  ): Promise<void> => {
    if (notifications.length > 0) {
      await producer.publish(notifications);
    }
  };

  const handle = async (
    incomingNotifications: readonly IncomingNotification[],
    subject?: Subject,
  ): Promise<Notification[]> => {
    const notifications = incomingNotifications.map((incomingNotification) =>
      enrichNotification(incomingNotification, subject),
    );
    const { immediate, nonImmediate } = categorizeNotifications(notifications);

    await sendNonImmediateNotifications(nonImmediate);
    await sendImmediateNotifications(immediate);

    return notifications;
  };

  return {
    handle,
  };
};
