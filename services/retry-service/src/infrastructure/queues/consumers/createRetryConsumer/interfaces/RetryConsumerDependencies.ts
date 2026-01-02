export interface RetryConsumerDependencies {
  readonly handler: (retryCount: number) => string;
}
