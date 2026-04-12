import { resolveStrategy } from "../../../domain/strategies/index.js";
import { type Notification } from "../../../domain/types/index.js";

import {
  type DeliveryService,
  type DeliveryServiceDependencies,
} from "./interfaces/index.js";

export const createDeliveryService = (
  dependencies: DeliveryServiceDependencies,
): DeliveryService => {
  const { channels } = dependencies;

  if (channels.length === 0) {
    throw new Error("В сервис не передано ни одного канала");
  }

  const deliver = async (notification: Notification): Promise<void> => {
    const handler = resolveStrategy(notification.strategy);

    await handler(notification, channels);
  };

  return {
    deliver,
  };
};
