import { type Channel } from "../../../../../domain/ports/index.js";

export interface RateLimitDependencies {
  readonly channel: Channel;
}
