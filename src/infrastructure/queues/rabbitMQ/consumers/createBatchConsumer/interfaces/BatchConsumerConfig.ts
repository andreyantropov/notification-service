export interface BatchConsumerConfig {
  url: string;
  queue: string;
  maxBatchSize?: number;
  batchSizeFlushTimeoutMs?: number;
  onError?: (error: unknown) => void;
}
