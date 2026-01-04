import type { MeteredRetryServiceDependencies } from "./interfaces/MeteredRetryServiceDependencies.js";
import type { RetryService } from "../../interfaces/RetryService.js";
import { NOTIFICATIONS_RETRY_ROUTING_TOTAL } from "./constants/index.js";

export const createMeteredRetryService = (
  dependencies: MeteredRetryServiceDependencies,
): RetryService => {
  const { retryService, meter } = dependencies;

  const getRetryQueue = (retryCount: number): string => {
    const retryQueue = retryService.getRetryQueue(retryCount);
    meter.increment(NOTIFICATIONS_RETRY_ROUTING_TOTAL, { retryQueue });

    return retryQueue;
  };

  return { getRetryQueue };
};
