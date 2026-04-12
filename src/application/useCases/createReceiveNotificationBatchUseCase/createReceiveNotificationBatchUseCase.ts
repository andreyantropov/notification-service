import { type Initiator } from "../../../domain/types/index.js";
import {
  type IncomingNotification,
  type NotificationResult,
  NOTIFY_STATUS,
} from "../../types/index.js";

import {
  type ReceiveNotificationBatchUseCase,
  type ReceiveNotificationBatchUseCaseDependencies,
} from "./interfaces/index.js";

export const createReceiveNotificationBatchUseCase = (
  dependencies: ReceiveNotificationBatchUseCaseDependencies,
): ReceiveNotificationBatchUseCase => {
  const { enrichmentService, deliveryService } = dependencies;

  const execute = async (
    incomingNotifications: readonly IncomingNotification[],
    initiator: Initiator,
  ): Promise<NotificationResult[]> => {
    const notifications = incomingNotifications.map((incomingNotification) =>
      enrichmentService.enrich(incomingNotification, initiator),
    );

    const promises = notifications.map((notification) =>
      deliveryService.deliver(notification),
    );

    const results = await Promise.allSettled(promises);
    const notificationResults: NotificationResult[] = results.map(
      (result, index) =>
        result.status === "fulfilled"
          ? { status: NOTIFY_STATUS.SUCCESS, payload: notifications[index] }
          : {
              status: NOTIFY_STATUS.SERVER_ERROR,
              error: {
                message: "Не удалось отправить уведомление",
              },
            },
    );

    return notificationResults;
  };

  return {
    execute,
  };
};
