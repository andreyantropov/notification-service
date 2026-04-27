export interface RateLimitConfig {
  readonly concurrency: number;
  readonly delayMs: number;
}
