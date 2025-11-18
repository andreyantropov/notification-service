import { Meter } from "../../../../../application/ports/Meter.js";
import { Channel } from "../../../../../domain/ports/Channel.js";

export interface MeteredChannelDependencies {
  channel: Channel;
  meter: Meter;
}
