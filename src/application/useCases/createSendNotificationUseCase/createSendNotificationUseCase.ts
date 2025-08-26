import { Notification } from "../../../domain/interfaces/Notification.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import {
  NotificationDeliveryService,
  SendResult,
} from "../../services/createNotificationDeliveryService/index.js";
import {
  EventType,
  NotificationLoggerService,
} from "../../services/createNotificationLoggerService/index.js";
import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";

export const createSendNotificationUseCase = (
  notificationDeliveryService: NotificationDeliveryService,
  notificationLoggerService: NotificationLoggerService,
): SendNotificationUseCase => {
  const send = async (
    notification: Notification | Notification[],
  ): Promise<SendResult[]> => {
    const results = await notificationDeliveryService.send(notification);

    if (results.some((res) => !res.success)) {
      notificationLoggerService.writeLog({
        level: LogLevel.Error,
        message: `Не удалось отправить уведомление`,
        eventType: EventType.NotificationError,
        spanId: `createSendNotificationUseCase`,
        payload: results,
      });
    } else {
      notificationLoggerService.writeLog({
        level: LogLevel.Info,
        message: `Уведомление успешно отправлено`,
        eventType: EventType.NotificationSuccess,
        spanId: `createSendNotificationUseCase`,
        payload: results,
      });
    }

    return results;
  };

  const checkHealth = notificationDeliveryService.checkHealth
    ? async (): Promise<void> => {
        try {
          await notificationDeliveryService.checkHealth?.();
          notificationLoggerService.writeLog({
            level: LogLevel.Info,
            message: `Проверка HealthCheck выполнена успешно`,
            eventType: EventType.HealthCheckSuccess,
            spanId: `createSendNotificationUseCase`,
          });
        } catch (error) {
          notificationLoggerService.writeLog({
            level: LogLevel.Error,
            message: `Проверка HealthCheck вернула ошибка`,
            eventType: EventType.HealthCheckError,
            spanId: `createSendNotificationUseCase`,
            error: error,
          });
          throw error;
        }
      }
    : undefined;

  return {
    send,
    ...(checkHealth ? { checkHealth } : {}),
  };
};
