export interface RetryService {
  readonly getRetryQueue: (retryCount: number) => string;
}
