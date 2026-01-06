import type { Logger } from "@notification-platform/shared";
import type { Channel } from "../../../../../domain/ports/index.js";

export interface LoggedChannelDependencies {
  readonly channel: Channel;
  readonly logger: Logger;
}
