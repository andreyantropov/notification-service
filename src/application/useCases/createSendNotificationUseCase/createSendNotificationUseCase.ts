import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";
import { SendNotificationUseCaseDependencies } from "./interfaces/SendNotificationUseCaseDependencies.js";
import { Notification } from "../../../domain/types/Notification.js";
import { DEFAULT_LOGGER } from "../../../shared/constants/defaults.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { BufferedNotification } from "../../types/BufferedNotification.js";

export const createSendNotificationUseCase = (
  dependencies: SendNotificationUseCaseDependencies,
): SendNotificationUseCase => {
  const {
    buffer,
    notificationDeliveryService,
    tracingContextManager,
    loggerAdapter = DEFAULT_LOGGER,
  } = dependencies;

  const sendUrgentNotifications = async (
    urgentNotifications: Notification[],
  ): Promise<void> => {
    await notificationDeliveryService.send(urgentNotifications);
  };

  const enqueueUnurgentNotifications = async (
    bufferedNotifications: BufferedNotification[],
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
      const currentContext = tracingContextManager.active();
      const bufferedNotifications: BufferedNotification[] =
        unurgentNotifications.map((n) => ({
          notification: n,
          otelContext: currentContext,
        }));
      await enqueueUnurgentNotifications(bufferedNotifications);
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
