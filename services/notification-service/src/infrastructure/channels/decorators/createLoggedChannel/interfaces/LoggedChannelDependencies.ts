import type { Logger } from "../../../../../application/ports/index.js";
import type { Channel } from "../../../../../domain/ports/index.js";

export interface LoggedChannelDependencies {
  readonly channel: Channel;
  readonly logger: Logger;
}
