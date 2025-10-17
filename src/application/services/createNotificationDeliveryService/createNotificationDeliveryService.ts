import { DeliveryResult } from "./interfaces/DeliveryResult.js";
import { NotificationDeliveryService } from "./interfaces/NotificationDeliveryService.js";
import { NotificationDeliveryServiceDependencies } from "./interfaces/NotificationDeliveryServiceDependencies.js";
import {
  DEFAULT_STRATEGY_KEY,
  strategyRegistry,
} from "./strategies/strategyRegistry.js";
import { Notification } from "../../../domain/types/Notification.js";

export const createNotificationDeliveryService = (
  dependencies: NotificationDeliveryServiceDependencies,
): NotificationDeliveryService => {
  const { channels } = dependencies;

  if (!channels || channels.length === 0) {
    throw new Error("В сервис не передано ни одного канала");
  }

  const send = async (
    notifications: Notification[],
  ): Promise<DeliveryResult[]> => {
    const results = await Promise.allSettled(
      notifications.map((notification) => {
        const key = notification.strategy ?? DEFAULT_STRATEGY_KEY;
        const strategy = strategyRegistry[key];

        return strategy(notification, channels);
      }),
    );

    return results.map((result, index): DeliveryResult => {
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
    const healthChecks = channels
      .filter((channel) => channel.checkHealth)
      .map(async (channel) => {
        await channel.checkHealth!();
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
