import type { Tracer } from "../../../../../application/ports/index.js";
import type { Channel } from "../../../../../domain/ports/index.js";

export interface TrasedChannelDependencies {
  readonly channel: Channel;
  readonly tracer: Tracer;
}
