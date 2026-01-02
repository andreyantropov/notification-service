import type { ChannelType } from "../../../../domain/types/index.js";

export interface Warning {
  readonly message: string;
  readonly details?: unknown;
  readonly contact?: string;
  readonly channel?: ChannelType;
}
