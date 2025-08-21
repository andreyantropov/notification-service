import { Notification } from "../../../domain/interfaces/Notification.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";
import {
  EventType,
  NotificationLoggerService,
} from "../../services/createNotificationLoggerService/index.js";
import { NotificationBatchResult } from "./interfaces/NotificationBatchResult.js";
import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";

export const createSendNotificationUseCase = (
  notificationDeliveryService: NotificationDeliveryService,
  notificationLoggerService: NotificationLoggerService,
): SendNotificationUseCase => {
  const send = async (
    notification: Notification | Notification[],
  ): Promise<NotificationBatchResult> => {
    const results = await notificationDeliveryService.send(notification);

    const totalCount = results.length;
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.length - successCount;

    if (errorCount === 0) {
      notificationLoggerService.writeLog({
        level: LogLevel.Info,
        message: `Уведомление успешно отправлено`,
        eventType: EventType.NotificationSuccess,
        spanId: `createSendNotificationUseCase`,
        payload: results,
      });
    } else if (successCount === 0) {
      notificationLoggerService.writeLog({
        level: LogLevel.Error,
        message: `Не удалось отправить уведомление`,
        eventType: EventType.NotificationError,
        spanId: `createSendNotificationUseCase`,
        payload: results,
      });
    } else {
      notificationLoggerService.writeLog({
        level: LogLevel.Warning,
        message: `Частичная ошибка: ${errorCount} из ${totalCount} уведомлений не отправлены`,
        eventType: EventType.NotificationWarning,
        spanId: `createSendNotificationUseCase`,
        payload: results,
      });
    }

    return {
      totalCount,
      successCount,
      errorCount,
      results,
    };
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
