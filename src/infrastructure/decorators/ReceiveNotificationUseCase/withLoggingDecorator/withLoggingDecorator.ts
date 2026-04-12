import { type IncomingNotification } from "../../../../application/types/index.js";
import { type ReceiveNotificationUseCase } from "../../../../application/useCases/index.js";
import {
  type Initiator,
  type Notification,
} from "../../../../domain/types/index.js";
import { EVENT_TYPE, TRIGGER_TYPE } from "../../../telemetry/index.js";

import { type LoggingDecoratorDependencies } from "./interfaces/index.js";

export const withLoggingDecorator = (
  dependencies: LoggingDecoratorDependencies,
): ReceiveNotificationUseCase => {
  const { receiveNotificationUseCase, logger } = dependencies;

  const execute = async (
    incomingNotification: IncomingNotification,
    initiator: Initiator,
  ): Promise<Notification> => {
    const start = Date.now();
    let result: Notification | undefined;
    let error: unknown;

    try {
      result = await receiveNotificationUseCase.execute(
        incomingNotification,
        initiator,
      );

      return result;
    } catch (err) {
      error = err;

      throw err;
    } finally {
      const durationMs = Date.now() - start;
      const isSuccess = !error;

      const log = {
        message: isSuccess
          ? "Уведомление успешно отправлено"
          : "Не удалось отправить уведомление",
        eventName: "notification.receive",
        eventType: EVENT_TYPE.MESSAGING,
        trigger: TRIGGER_TYPE.API,
        durationMs,
        details: {
          initiator: initiator.id,
          ...(result ? { id: result.id } : {}),
        },
        ...(error ? { error } : {}),
      };

      if (isSuccess) {
        logger.info(log);
      } else {
        logger.error(log);
      }
    }
  };

  return { ...receiveNotificationUseCase, execute };
};
