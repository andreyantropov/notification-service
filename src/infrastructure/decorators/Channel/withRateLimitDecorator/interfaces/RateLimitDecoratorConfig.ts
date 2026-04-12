export interface RateLimitDecoratorConfig {
  readonly concurrency: number;
  readonly delayMs: number;
}
