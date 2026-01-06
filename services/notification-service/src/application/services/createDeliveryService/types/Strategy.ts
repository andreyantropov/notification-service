import type { Channel } from "../../../../domain/ports/Channel.js";
import type { Notification } from "@notification-platform/shared";
import type { Result } from "../interfaces/Result.js";

export type Strategy = (
  notification: Notification,
  channels: readonly Channel[],
) => Promise<Result>;
