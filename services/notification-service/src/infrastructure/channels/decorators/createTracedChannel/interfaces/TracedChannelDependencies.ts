import type { Tracer } from "@notification-platform/shared";
import type { Channel } from "../../../../../domain/ports/index.js";

export interface TrasedChannelDependencies {
  readonly channel: Channel;
  readonly tracer: Tracer;
}
