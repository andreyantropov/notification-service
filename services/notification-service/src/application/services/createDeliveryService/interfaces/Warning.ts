import type { ChannelType } from "@notification-platform/shared";

export interface Warning {
  readonly message: string;
  readonly details?: unknown;
  readonly contact?: string;
  readonly channel?: ChannelType;
}
