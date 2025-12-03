import { Tracer } from "../../../../../application/ports/index.js";
import { Channel } from "../../../../../domain/ports/index.js";

export interface TrasedChannelDependencies {
  readonly channel: Channel;
  readonly tracer: Tracer;
}
