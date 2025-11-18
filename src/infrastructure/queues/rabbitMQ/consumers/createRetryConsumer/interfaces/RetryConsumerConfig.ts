export interface RetryConsumerConfig {
  url: string;
  queue: string;
  onError?: (error: unknown) => void;
}
