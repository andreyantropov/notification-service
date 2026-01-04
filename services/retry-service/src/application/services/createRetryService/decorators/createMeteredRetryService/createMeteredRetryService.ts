import type { MeteredRetryServiceDependencies } from "./interfaces/MeteredRetryServiceDependencies.js";
import type { RetryService } from "../../interfaces/RetryService.js";
import { RETRY_ROUTING } from "./constants/index.js";

export const createMeteredRetryService = (
  dependencies: MeteredRetryServiceDependencies,
): RetryService => {
  const { retryService, meter } = dependencies;

  const getRetryQueue = (retryCount: number): string => {
    const retryQueue = retryService.getRetryQueue(retryCount);
    meter.increment(RETRY_ROUTING, { retryQueue });

    return retryQueue;
  };

  return { getRetryQueue };
};
