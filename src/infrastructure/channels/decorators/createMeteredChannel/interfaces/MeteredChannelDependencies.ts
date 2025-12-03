import { Meter } from "../../../../../application/ports/index.js";
import { Channel } from "../../../../../domain/ports/index.js";

export interface MeteredChannelDependencies {
  readonly channel: Channel;
  readonly meter: Meter;
}
