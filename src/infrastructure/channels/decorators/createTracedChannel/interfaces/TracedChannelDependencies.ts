import { Channel } from "../../../../../domain/ports/Channel.js";
import { Tracer } from "../../../../ports/Tracer.js";

export interface TrasedChannelDependencies {
  channel: Channel;
  tracer: Tracer;
}
