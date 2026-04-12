export interface RateLimiterMiddlewareConfig {
  readonly windowMs: number;
  readonly max: number;
}
