export interface BatchConsumerConfig {
  url: string;
  queue: string;
  maxBatchSize?: number;
  batchSizeFlushTimeoutMs?: number;
  nackOptions?: {
    requeue?: boolean;
    multiple?: boolean;
  };
  onError?: (error: unknown) => void;
}
