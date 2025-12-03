import { Logger } from "../../../../../application/ports/index.js";
import { Channel } from "../../../../../domain/ports/index.js";

export interface LoggedChannelDependencies {
  readonly channel: Channel;
  readonly logger: Logger;
}
