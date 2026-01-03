export interface RetryConsumerConfig {
  readonly url: string;
  readonly queue: string;
  readonly nackOptions?: {
    readonly requeue?: boolean;
    readonly multiple?: boolean;
  };
  readonly retryPublishTimeoutMs?: number;
  readonly healthcheckTimeoutMs?: number;
  readonly onError?: (error: unknown) => void;
}
