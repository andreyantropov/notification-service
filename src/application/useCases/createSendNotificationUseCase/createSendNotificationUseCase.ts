import { context } from "@opentelemetry/api";

import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";
import { SendNotificationUseCaseDependencies } from "./interfaces/SendNotificationUseCaseDependencies.js";
import { Notification } from "../../../domain/types/Notification.js";
import { DEFAULT_LOGGER } from "../../../shared/constants/defaults.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { BufferedNotification } from "../../types/BufferedNotification.js";

export const createSendNotificationUseCase = (
  dependencies: SendNotificationUseCaseDependencies,
): SendNotificationUseCase => {
  const {
    buffer,
    notificationDeliveryService,
    loggerAdapter = DEFAULT_LOGGER,
  } = dependencies;

  const sendUrgentNotifications = async (
    urgentNotifications: Notification[],
  ): Promise<void> => {
    const results = await notificationDeliveryService.send(urgentNotifications);
    const isErrors = results.some((res) => !res.success);
    const isWarnings = results.some(
      (res) => res.warnings && res.warnings.length !== 0,
    );

    if (isErrors) {
      loggerAdapter.writeLog({
        level: LogLevel.Error,
        message: `Не удалось отправить одно или несколько уведомлений`,
        eventType: EventType.MessagePublish,
        details: results,
      });
    } else if (isWarnings) {
      loggerAdapter.writeLog({
        level: LogLevel.Warning,
        message: `Уведомление отправлено, но в ходе работы возникли ошибки`,
        eventType: EventType.MessagePublish,
        details: results,
      });
    } else {
      loggerAdapter.writeLog({
        level: LogLevel.Info,
        message: `Уведомление успешно отправлено`,
        eventType: EventType.MessagePublish,
        details: results,
      });
    }
  };

  const enqueueUnurgentNotifications = async (
    bufferedNotifications: BufferedNotification[],
  ) => {
    try {
      await buffer.append(bufferedNotifications);
      loggerAdapter.writeLog({
        level: LogLevel.Debug,
        message: `${bufferedNotifications.length} несрочных уведомлений добавлено в буфер`,
        eventType: EventType.CacheOperation,
        details: bufferedNotifications.map((n) => n.notification),
      });
    } catch (error) {
      loggerAdapter.writeLog({
        level: LogLevel.Error,
        message: "Не удалось добавить уведомления в буфер",
        eventType: EventType.CacheOperation,
        details: bufferedNotifications.map((n) => n.notification),
        error,
      });
    }
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
      const currentContext = context.active();
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
