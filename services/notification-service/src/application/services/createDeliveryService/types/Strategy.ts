import type { Channel } from "../../../../domain/ports/Channel.js";
import type { Notification } from "../../../../domain/types/Notification.js";
import type { Result } from "../interfaces/Result.js";

export type Strategy = (
  notification: Notification,
  channels: readonly Channel[],
) => Promise<Result>;
