import { type Channel } from "../../../../../domain/ports/index.js";

export interface RateLimitDecoratorDependencies {
  readonly channel: Channel;
}
