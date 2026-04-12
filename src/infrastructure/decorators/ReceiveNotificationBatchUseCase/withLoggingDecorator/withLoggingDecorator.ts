import {
  type IncomingNotification,
  type NotificationResult,
  NOTIFY_STATUS,
} from "../../../../application/types/index.js";
import { type ReceiveNotificationBatchUseCase } from "../../../../application/useCases/index.js";
import { type Initiator } from "../../../../domain/types/index.js";
import { EVENT_TYPE, TRIGGER_TYPE } from "../../../telemetry/index.js";

import { type LoggingDecoratorDependencies } from "./interfaces/index.js";

export const withLoggingDecorator = (
  dependencies: LoggingDecoratorDependencies,
): ReceiveNotificationBatchUseCase => {
  const { receiveNotificationBatchUseCase, logger } = dependencies;

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

    const totalCount = results.length;
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

    const isSuccess = rejectedCount === 0;

    const log = {
      message: isSuccess
        ? "Все уведомления успешно отправлены"
        : "Не удалось отправить некоторые уведомления",
      eventName: "notification.receive_batch",
      eventType: EVENT_TYPE.MESSAGING,
      trigger: TRIGGER_TYPE.API,
      durationMs,
      details: {
        total: totalCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        acceptedIds: results
          .filter((result) => result.status === NOTIFY_STATUS.SUCCESS)
          .map((result) => result.payload.id),
        initiator: initiator.id,
      },
    };

    if (isSuccess) {
      logger.info(log);
    } else {
      logger.error(log);
    }

    return results;
  };

  return { ...receiveNotificationBatchUseCase, execute };
};
