import { NotificationProcessService } from "./interfaces/NotificationProcessService";
import { LogLevel } from "../../../shared/enums/LogLevel";
import { EventType } from "../notificationLoggerService";
import { NotificationProcessServiceConfig } from "./interfaces/NotificationProcessServiceConfig";

export const createNotificationProcessService = ({
  notificationSource,
  notificationDeliveryService,
  notificationLogger,
  resolveRecipients,
}: NotificationProcessServiceConfig): NotificationProcessService => {
  const processNotifications = async (): Promise<void> => {
    try {
      const notifications = await notificationSource.getNotifications();

      for (const notification of notifications) {
        const recipients = resolveRecipients?.(notification) ?? [];

        if (recipients.length === 0) {
          await notificationLogger.writeLog({
            level: LogLevel.Error,
            message: "Отсутствуют контакты клиента",
            eventType: EventType.SendNotificationError,
            spanId: "processNotifications",
            payload: notification,
            error: new Error("No recipients available"),
          });
          await notificationSource.deleteNotification(notification.id);
          continue;
        }

        try {
          await notificationDeliveryService.send(
            recipients,
            notification.message,
          );
          await notificationLogger.writeLog({
            level: LogLevel.Info,
            message: "Уведомление успешно отправлено",
            eventType: EventType.SendNotificationSuccess,
            spanId: "processNotifications",
            payload: notification,
            error: null,
          });
        } catch (error) {
          await notificationLogger.writeLog({
            level: LogLevel.Error,
            message: "Не удалось отправить уведомление",
            eventType: EventType.SendNotificationError,
            spanId: "processNotifications",
            payload: notification,
            error: error,
          });
        }
        await notificationSource.deleteNotification(notification.id);
      }
    } catch (error) {
      await notificationLogger.writeLog({
        level: LogLevel.Critical,
        message: "Не удалось считать или удалить данные из БД",
        eventType: EventType.SendNotificationError,
        spanId: "processNotifications",
        payload: null,
        error: error,
      });
    }
  };

  return {
    processNotifications,
  };
};
