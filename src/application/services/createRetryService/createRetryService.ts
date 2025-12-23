import {
  NOTIFICATIONS_DQL,
  NOTIFICATIONS_RETRY_2H,
  NOTIFICATIONS_RETRY_30M,
} from "./constants/index.js";
import type { RetryService } from "./interfaces/index.js";

export const createRetryService = (): RetryService => {
  const getRetryQueue = (retryCount: number): string => {
    switch (retryCount) {
      case 1:
        return NOTIFICATIONS_RETRY_30M;
      case 2:
        return NOTIFICATIONS_RETRY_2H;
      default:
        return NOTIFICATIONS_DQL;
    }
  };

  return { getRetryQueue };
};
