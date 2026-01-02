import type {
  Log,
  LoggedDeliveryServiceDependencies,
  Summary,
} from "./interfaces/index.js";
import type { Notification } from "../../../../../domain/types/index.js";
import { EventType } from "../../../../enums/index.js";
import type { DeliveryService, Result } from "../../interfaces/index.js";

export const createLoggedDeliveryService = (
  dependencies: LoggedDeliveryServiceDependencies,
): DeliveryService => {
  const { deliveryService, logger } = dependencies;

  const collectSummary = (results: readonly Result[]): Summary => {
    const successfulIds: string[] = [];
    const failedIds: string[] = [];
    const warningIds: string[] = [];

    for (const result of results) {
      const id = result.notification.id;
      if (result.status === "success") {
        successfulIds.push(id);
      } else {
        failedIds.push(id);
      }

      if (result.warnings && result.warnings.length > 0) {
        warningIds.push(id);
      }
    }

    const notificationsCount = results.length;
    const successfulCount = successfulIds.length;
    const failedCount = failedIds.length;
    const warningCount = warningIds.length;

    return {
      notificationsCount,
      successfulIds,
      failedIds,
      warningIds,
      successfulCount,
      failedCount,
      warningCount,
    };
  };

  const buildLog = (summary: Summary, durationMs: number): Log => {
    const {
      notificationsCount,
      failedIds,
      failedCount,
      warningIds,
      warningCount,
      successfulIds,
      successfulCount,
    } = summary;

    if (summary.failedCount > 0) {
      return {
        logLevel: "error",
        message: "Не удалось отправить часть уведомлений",
        eventType: EventType.MessagePublish,
        durationMs,
        details: {
          notificationsCount,
          failedIds,
          failedCount,
          warningIds,
          warningCount,
          successfulIds,
          successfulCount,
        },
      };
    } else if (summary.warningCount > 0) {
      return {
        logLevel: "warning",
        message: "Уведомления отправлены с предупреждениями",
        eventType: EventType.MessagePublish,
        durationMs,
        details: {
          notificationsCount,
          warningIds,
          warningCount,
          successfulIds,
          successfulCount,
        },
      };
    } else {
      return {
        logLevel: "info",
        message: "Уведомления успешно отправлены",
        eventType: EventType.MessagePublish,
        durationMs,
        details: {
          notificationsCount,
          successfulIds,
          successfulCount,
        },
      };
    }
  };

  const send = async (
    notifications: readonly Notification[],
  ): Promise<Result[]> => {
    const start = Date.now();
    const results = await deliveryService.send(notifications);
    const durationMs = Date.now() - start;

    const summary = collectSummary(results);
    const log = buildLog(summary, durationMs);

    logger[log.logLevel](log);

    return results;
  };

  const checkHealth = deliveryService.checkHealth
    ? async (): Promise<void> => {
        const start = Date.now();
        try {
          await deliveryService.checkHealth!();
          const durationMs = Date.now() - start;
          logger.debug({
            message: "Сервис доставки уведомлений готов к работе",
            eventType: EventType.HealthCheck,
            durationMs,
          });
        } catch (error) {
          const durationMs = Date.now() - start;
          logger.error({
            message: "Сервис доставки уведомлений не отвечает",
            eventType: EventType.HealthCheck,
            durationMs,
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
