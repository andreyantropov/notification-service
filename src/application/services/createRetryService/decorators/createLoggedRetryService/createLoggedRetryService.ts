import type { LoggedRetryServiceDependencies } from "./interfaces/index.js";
import { EventType } from "../../../../enums/index.js";
import { NOTIFICATIONS_DQL } from "../../constants/index.js";
import type { RetryService } from "../../interfaces/RetryService.js";

export const createLoggedRetryService = (
  dependencies: LoggedRetryServiceDependencies,
): RetryService => {
  const { retryService, logger } = dependencies;

  const getRetryQueue = (retryCount: number): string => {
    const start = Date.now();
    const retryQueue = retryService.getRetryQueue(retryCount);
    const durationMs = Date.now() - start;

    const logLevel = retryQueue === NOTIFICATIONS_DQL ? "error" : "warning";
    logger[logLevel]({
      message: `Уведомление отправлено в retry-очередь ${retryQueue}`,
      eventType: EventType.MessagePublish,
      durationMs,
      details: {
        retryCount,
        target: retryQueue,
      },
    });

    return retryQueue;
  };

  return { getRetryQueue };
};
