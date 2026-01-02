import type { Meter } from "../../../../../application/ports/index.js";
import type { Channel } from "../../../../../domain/ports/index.js";

export interface MeteredChannelDependencies {
  readonly channel: Channel;
  readonly meter: Meter;
}
