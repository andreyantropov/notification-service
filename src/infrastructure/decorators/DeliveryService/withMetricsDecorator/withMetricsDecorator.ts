import { type DeliveryService } from "../../../../application/services/index.js";
import { type Notification } from "../../../../domain/types/index.js";

import { type MetricsDecoratorDependencies } from "./interfaces/index.js";

export const withMetricsDecorator = (
  dependencies: MetricsDecoratorDependencies,
): DeliveryService => {
  const { deliveryService, meter } = dependencies;

  const deliver = async (notification: Notification): Promise<void> => {
    const start = Date.now();
    let status = "success";

    try {
      await deliveryService.deliver(notification);
    } catch (error) {
      status = "error";
      throw error;
    } finally {
      const durationMs = Date.now() - start;
      const labels = {
        status,
        strategy: notification.strategy,
      };

      meter.increment("notifications_delivered_total", labels);
      meter.record("notifications_delivered_duration_ms", durationMs, labels);
    }
  };

  return { ...deliveryService, deliver };
};
