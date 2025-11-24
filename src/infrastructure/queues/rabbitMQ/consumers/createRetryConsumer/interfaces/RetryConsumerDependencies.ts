export interface RetryConsumerDependencies {
  handler: (retryCount: number) => string;
}
