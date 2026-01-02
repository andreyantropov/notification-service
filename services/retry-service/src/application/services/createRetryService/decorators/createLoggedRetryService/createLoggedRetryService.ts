import type { LoggedRetryServiceConfig } from "./interfaces/index.js";
import { EventType } from "../../../../enums/index.js";
import { NOTIFICATIONS_DQL } from "../../constants/index.js";
import type { RetryService } from "../../interfaces/RetryService.js";

export const createLoggedRetryService = (
  config: LoggedRetryServiceConfig,
): RetryService => {
  const { retryService, logger } = config;

  const getRetryQueue = (retryCount: number): string => {
    const start = Date.now();
    const result = retryService.getRetryQueue(retryCount);
    const durationMs = Date.now() - start;

    const logLevel = result === NOTIFICATIONS_DQL ? "error" : "warning";
    logger[logLevel]({
      message: `Уведомление отправлено в retry-очередь ${result}`,
      eventType: EventType.MessagePublish,
      durationMs,
      details: {
        retryCount,
        target: result,
      },
    });

    return result;
  };

  return { getRetryQueue };
};
