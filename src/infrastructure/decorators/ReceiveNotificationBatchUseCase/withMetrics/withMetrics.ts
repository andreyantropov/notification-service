import {
  type IncomingNotification,
  type NotificationResult,
  NOTIFY_STATUS,
} from "../../../../application/types/index.js";
import { type ReceiveNotificationBatchUseCase } from "../../../../application/useCases/index.js";
import { type Initiator } from "../../../../domain/types/index.js";

import { type MetricsDependencies } from "./interfaces/index.js";

export const withMetrics = (
  dependencies: MetricsDependencies,
): ReceiveNotificationBatchUseCase => {
  const { receiveNotificationBatchUseCase, meter } = dependencies;

  const execute = async (
    incomingNotifications: readonly IncomingNotification[],
    initiator: Initiator,
  ): Promise<NotificationResult[]> => {
    const start = Date.now();

    const results = await receiveNotificationBatchUseCase.execute(
      incomingNotifications,
      initiator,
    );

    const durationMs = Date.now() - start;
    const baseLabels = { mode: "batch", initiator: initiator.id };

    const { acceptedCount, rejectedCount } = results.reduce(
      (acc, result) => {
        if (result.status === NOTIFY_STATUS.SUCCESS) {
          acc.acceptedCount++;
        } else {
          acc.rejectedCount++;
        }
        return acc;
      },
      { acceptedCount: 0, rejectedCount: 0 },
    );

    if (acceptedCount > 0) {
      meter.add("notifications_received_total", acceptedCount, {
        ...baseLabels,
        status: "success",
      });
    }
    if (rejectedCount > 0) {
      meter.add("notifications_received_total", rejectedCount, {
        ...baseLabels,
        status: "error",
      });
    }

    meter.record("notifications_received_duration_ms", durationMs, {
      ...baseLabels,
      status: rejectedCount === 0 ? "success" : "error",
    });

    return results;
  };

  return { ...receiveNotificationBatchUseCase, execute };
};
