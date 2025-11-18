import { Tracer } from "../../../../../application/ports/Tracer.js";
import { Channel } from "../../../../../domain/ports/Channel.js";

export interface TrasedChannelDependencies {
  channel: Channel;
  tracer: Tracer;
}
