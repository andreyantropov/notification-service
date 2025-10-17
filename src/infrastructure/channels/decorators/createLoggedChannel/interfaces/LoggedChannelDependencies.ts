import { Channel } from "../../../../../domain/ports/Channel.js";
import { Logger } from "../../../../ports/Logger.js";

export interface LoggedChannelDependencies {
  channel: Channel;
  logger: Logger;
}
