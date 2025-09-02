import { Notification } from "../../../domain/types/Notification.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { LoggerAdapter } from "../../ports/LoggerAdapter.js";
import { Buffer } from "../../ports/Buffer.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";
import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";

export const createSendNotificationUseCase = (
  buffer: Buffer<Notification>,
  notificationDeliveryService: NotificationDeliveryService,
  loggerAdapter: LoggerAdapter,
): SendNotificationUseCase => {
  const sendUrgentNotifications = async (
    urgentNotifications: Notification[],
  ): Promise<void> => {
    const results = await notificationDeliveryService.send(urgentNotifications);

    if (results.some((res) => !res.success)) {
      loggerAdapter.writeLog({
        level: LogLevel.Error,
        message: `Не удалось отправить уведомление`,
        eventType: EventType.NotificationError,
        spanId: `createSendNotificationUseCase`,
        payload: results,
      });
    } else {
      loggerAdapter.writeLog({
        level: LogLevel.Info,
        message: `Уведомление успешно отправлено`,
        eventType: EventType.NotificationSuccess,
        spanId: `createSendNotificationUseCase`,
        payload: results,
      });
    }
  };

  const enqueueUnurgentNotifications = async (
    unurgentNotifications: Notification[],
  ) => {
    try {
      await buffer.append(unurgentNotifications);
      loggerAdapter.writeLog({
        level: LogLevel.Debug,
        message: `${unurgentNotifications.length} несрочных уведомлений добавлено в буфер`,
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: unurgentNotifications,
      });
    } catch (error) {
      loggerAdapter.writeLog({
        level: LogLevel.Error,
        message: "Не удалось добавить уведомления в буфер",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationUseCase",
        error,
        payload: unurgentNotifications,
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

    const urgentNotifications = notifications.filter((elem) => elem.isUrgent);
    if (urgentNotifications.length > 0) {
      await sendUrgentNotifications(urgentNotifications);
    }

    const unurgentNotifications = notifications.filter(
      (elem) => !elem.isUrgent,
    );
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
