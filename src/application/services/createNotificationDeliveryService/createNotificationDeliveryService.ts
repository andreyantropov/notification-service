import { NotificationDeliveryService } from "./interfaces/NotificationDeliveryService.js";
import { Notification } from "../../../domain/interfaces/Notification.js";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";
import { NotificationDeliveryServiceConfig } from "./interfaces/NotificationDeliveryServiceConfig.js";
import { DeliveryStrategy } from "./types/DeliveryStrategy.js";
import { sendToFirstAvailableStrategy } from "./strategies/sendToFirstAvailableStrategy/sendToFirstAvailableStrategy.js";

export const createNotificationDeliveryService = (
  senders: NotificationSender[],
  strategy: DeliveryStrategy = sendToFirstAvailableStrategy,
  config?: NotificationDeliveryServiceConfig,
): NotificationDeliveryService => {
  if (!senders || senders.length === 0) {
    throw new Error("В сервис не передано ни одного сендера");
  }

  const { onError = () => {} } = config || {};

  const send = async (notification: Notification): Promise<void> => {
    await strategy(senders, notification, onError);
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
