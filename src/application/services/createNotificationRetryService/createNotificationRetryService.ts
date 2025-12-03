import { NotificationRetryService } from "./interfaces/index.js";

const FIRST_RETRY_QUEUE = "retry-1";
const SECOND_RETRY_QUEUE = "retry-2";
const DLQ = "dlq";

export const createNotificationRetryService = (): NotificationRetryService => {
  const getRetryQueue = (retryCount: number): string => {
    if (retryCount === 1) {
      return FIRST_RETRY_QUEUE;
    } else if (retryCount === 2) {
      return SECOND_RETRY_QUEUE;
    } else {
      return DLQ;
    }
  };

  return { getRetryQueue };
};
