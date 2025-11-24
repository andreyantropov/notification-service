export interface RetryConsumerConfig {
  url: string;
  queue: string;
  nackOptions?: {
    requeue?: boolean;
    multiple?: boolean;
  };
  onError?: (error: unknown) => void;
}
