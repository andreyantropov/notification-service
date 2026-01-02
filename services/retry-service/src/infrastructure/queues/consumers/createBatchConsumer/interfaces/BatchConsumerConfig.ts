export interface BatchConsumerConfig {
  readonly url: string;
  readonly queue: string;
  readonly maxBatchSize?: number;
  readonly batchFlushTimeoutMs?: number;
  readonly nackOptions?: {
    readonly requeue?: boolean;
    readonly multiple?: boolean;
  };
  readonly flushTimeoutMs?: number;
  readonly healthcheckTimeoutMs?: number;
  readonly onError?: (error: unknown) => void;
}
