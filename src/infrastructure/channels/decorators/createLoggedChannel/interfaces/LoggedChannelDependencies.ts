import { Logger } from "../../../../../application/ports/Logger.js";
import { Channel } from "../../../../../domain/ports/Channel.js";

export interface LoggedChannelDependencies {
  channel: Channel;
  logger: Logger;
}
