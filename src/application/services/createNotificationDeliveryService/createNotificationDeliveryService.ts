import { NotificationDeliveryService } from "./interfaces/NotificationDeliveryService.js";
import { NotificationDeliveryServiceConfig } from "./interfaces/NotificationDeliveryServiceConfig.js";
import { NotificationDeliveryServiceDependencies } from "./interfaces/NotificationDeliveryServiceDependencies.js";
import { SendResult } from "./interfaces/SendResult.js";
import { sendToFirstAvailableStrategy } from "./strategies/sendToFirstAvailableStrategy/sendToFirstAvailableStrategy.js";
import { Notification } from "../../../domain/types/Notification.js";
import { DEFAULT_CONFIG } from "../../../shared/constants/defaults.js";

export const createNotificationDeliveryService = (
  dependencies: NotificationDeliveryServiceDependencies,
  configs: NotificationDeliveryServiceConfig = DEFAULT_CONFIG,
): NotificationDeliveryService => {
  const { senders } = dependencies;
  const { strategy = sendToFirstAvailableStrategy } = configs;

  if (!senders || senders.length === 0) {
    throw new Error("В сервис не передано ни одного сендера");
  }

  const send = async (notifications: Notification[]): Promise<SendResult[]> => {
    const results = await Promise.allSettled(
      notifications.map((notification) => strategy(notification, senders)),
    );

    return results.map((result, index): SendResult => {
      const currentNotification = notifications[index];

      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          notification: currentNotification,
          error: result.reason,
        };
      }
    });
  };

  const checkHealth = async (): Promise<void> => {
    const healthChecks = senders
      .filter((sender) => sender.checkHealth)
      .map(async (sender) => {
        await sender.checkHealth!();
      });

    if (healthChecks.length === 0) {
      throw new Error("Нет доступных проверок работоспособности");
    }

    try {
      await Promise.all(healthChecks);
    } catch (error) {
      throw new Error("Часть сендров не готова к работе", { cause: error });
    }
  };

  return {
    send,
    checkHealth,
  };
};
