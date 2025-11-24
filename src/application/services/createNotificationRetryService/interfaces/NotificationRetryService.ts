export interface NotificationRetryService {
  getRetryQueue: (retryCount: number) => string;
}
