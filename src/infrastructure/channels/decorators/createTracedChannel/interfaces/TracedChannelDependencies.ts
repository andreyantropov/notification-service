import { Channel } from "../../../../../domain/ports/Channel.js";
import { TracingContextManager } from "../../../../ports/TracingContextManager.js";

export interface TrasedChannelDependencies {
  channel: Channel;
  tracingContextManager: TracingContextManager;
}
