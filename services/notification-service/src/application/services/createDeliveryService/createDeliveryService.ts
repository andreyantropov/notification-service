import { DEFAULT_DELIVERY_STRATEGY } from "./constants/index.js";
import type {
  Result,
  DeliveryService,
  DeliveryServiceDependencies,
} from "./interfaces/index.js";
import {
  sendToAllAvailableStrategy,
  sendToFirstAvailableStrategy,
} from "./strategies/index.js";
import type { Strategy } from "./types/index.js";
import { DeliveryStrategy } from "../../../domain/enums/index.js";
import type { Notification } from "../../../domain/types/index.js";

export const createDeliveryService = (
  dependencies: DeliveryServiceDependencies,
): DeliveryService => {
  const { channels } = dependencies;

  if (!channels || channels.length === 0) {
    throw new Error("В сервис не передано ни одного канала");
  }

  const getStrategy = (strategy: DeliveryStrategy): Strategy => {
    switch (strategy) {
      case DeliveryStrategy.sendToFirstAvailable:
        return sendToFirstAvailableStrategy;
      case DeliveryStrategy.sendToAllAvailable:
        return sendToAllAvailableStrategy;
    }
  };

  const processNotification = async (
    notification: Notification,
  ): Promise<Result> => {
    try {
      const strategy = notification.strategy ?? DEFAULT_DELIVERY_STRATEGY;
      const handler = getStrategy(strategy);

      return await handler(notification, channels);
    } catch (error) {
      return {
        status: "failure",
        notification,
        error,
      };
    }
  };

  const send = async (
    notifications: readonly Notification[],
  ): Promise<Result[]> => {
    return Promise.all(
      notifications.map((notification) => processNotification(notification)),
    );
  };

  const checkHealth = async (): Promise<void> => {
    const healthChecks = channels
      .filter((channel) => channel.checkHealth)
      .map((channel) => channel.checkHealth!());

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
