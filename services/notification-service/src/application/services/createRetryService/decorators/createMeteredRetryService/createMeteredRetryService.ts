import type { MeteredRetryServiceConfig } from "./interfaces/MeteredRetryServiceConfig.js";
import type { RetryService } from "../../interfaces/RetryService.js";

export const createMeteredRetryService = (
  config: MeteredRetryServiceConfig,
): RetryService => {
  const { retryService, meter } = config;

  const getRetryQueue = (retryCount: number): string => {
    const result = retryService.getRetryQueue(retryCount);
    meter.incrementRetryRoutingByQueue(result);

    return result;
  };

  return { getRetryQueue };
};
