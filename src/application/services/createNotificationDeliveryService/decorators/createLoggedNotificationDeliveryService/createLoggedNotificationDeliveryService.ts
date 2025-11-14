import { LoggedNotificationDeliveryServiceDependencies } from "./interfaces/LoggedNotificationDeliveryServiceDependencies.js";
import { Notification } from "../../../../../domain/types/Notification.js";
import { EventType } from "../../../../enums/index.js";
import { DeliveryResult } from "../../interfaces/DeliveryResult.js";
import { NotificationDeliveryService } from "../../interfaces/NotificationDeliveryService.js";

export const createLoggedNotificationDeliveryService = (
  dependencies: LoggedNotificationDeliveryServiceDependencies,
): NotificationDeliveryService => {
  const { notificationDeliveryService, logger } = dependencies;

  const send = async (
    notifications: Notification[],
  ): Promise<DeliveryResult[]> => {
    const start = Date.now();
    try {
      const results = await notificationDeliveryService.send(notifications);
      const duration = Date.now() - start;

      const successfulIds = results
        .filter((r) => r.success)
        .map((r) => r.notification.id);
      const failedIds = results
        .filter((r) => !r.success)
        .map((r) => r.notification.id);
      const warningIds = results
        .filter((r) => r.warnings && r.warnings.length > 0)
        .map((r) => r.notification.id);

      const successfulCount = successfulIds.length;
      const failedCount = failedIds.length;
      const warningCount = warningIds.length;

      if (warningCount > 0) {
        logger.warning({
          message: "Уведомления отправлены с предупреждениями",
          eventType: EventType.MessagePublish,
          duration,
          details: {
            notificationCount: notifications.length,
            successfulCount,
            failedCount,
            warningCount,
            successfulIds,
            failedIds,
            warningIds,
          },
        });
      } else {
        logger.info({
          message: "Уведомления успешно отправлены",
          eventType: EventType.MessagePublish,
          duration,
          details: {
            notificationCount: notifications.length,
            successfulCount,
            failedCount,
            warningCount,
            successfulIds,
            failedIds,
            warningIds,
          },
        });
      }

      return results;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({
        message: "Не удалось отправить уведомления",
        eventType: EventType.MessagePublish,
        duration,
        details: {
          notificationCount: notifications.length,
          notificationIds: notifications.map((n) => n.id),
        },
        error,
      });
      throw error;
    }
  };

  const checkHealth = notificationDeliveryService.checkHealth
    ? async (): Promise<void> => {
        const start = Date.now();
        try {
          await notificationDeliveryService.checkHealth!();
          const duration = Date.now() - start;
          logger.debug({
            message: "Сервис доставки уведомлений готов к работе",
            eventType: EventType.HealthCheck,
            duration,
          });
        } catch (error) {
          const duration = Date.now() - start;
          logger.error({
            message: "Сервис доставки уведомлений не отвечает",
            eventType: EventType.HealthCheck,
            duration,
            error,
          });
          throw error;
        }
      }
    : undefined;

  return {
    send,
    checkHealth,
  };
};
