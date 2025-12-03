export interface NotificationRetryService {
  readonly getRetryQueue: (retryCount: number) => string;
}
