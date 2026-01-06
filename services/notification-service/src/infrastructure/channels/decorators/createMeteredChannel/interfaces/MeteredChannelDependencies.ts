import type { Meter } from "@notification-platform/shared";
import type { Channel } from "../../../../../domain/ports/index.js";

export interface MeteredChannelDependencies {
  readonly channel: Channel;
  readonly meter: Meter;
}
