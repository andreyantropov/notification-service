import { type IncomingNotification } from "../../../../application/types/index.js";
import { type ReceiveNotificationUseCase } from "../../../../application/useCases/index.js";
import {
  type Initiator,
  type Notification,
} from "../../../../domain/types/index.js";

import { type MetricsDecoratorDependencies } from "./interfaces/index.js";

export const withMetricsDecorator = (
  dependencies: MetricsDecoratorDependencies,
): ReceiveNotificationUseCase => {
  const { receiveNotificationUseCase, meter } = dependencies;

  const execute = async (
    incomingNotification: IncomingNotification,
    initiator: Initiator,
  ): Promise<Notification> => {
    const start = Date.now();
    let status = "success";

    try {
      return await receiveNotificationUseCase.execute(
        incomingNotification,
        initiator,
      );
    } catch (error) {
      status = "error";

      throw error;
    } finally {
      const durationMs = Date.now() - start;
      const labels = {
        mode: "single",
        status,
        initiator: initiator.id,
      };

      meter.increment("notifications_received_total", labels);
      meter.record("notifications_received_duration_ms", durationMs, labels);
    }
  };

  return { ...receiveNotificationUseCase, execute };
};
