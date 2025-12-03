import { Channel } from "../../../../domain/ports/Channel.js";
import { Notification } from "../../../../domain/types/Notification.js";
import { DeliveryResult } from "../interfaces/DeliveryResult.js";

export type DeliveryStrategy = (
  notification: Notification,
  channels: readonly Channel[],
) => Promise<DeliveryResult>;
