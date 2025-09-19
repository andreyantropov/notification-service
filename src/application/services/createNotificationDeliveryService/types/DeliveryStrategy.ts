import { Sender } from "../../../../domain/ports/Sender.js";
import { Notification } from "../../../../domain/types/Notification.js";
import { SendResult } from "../interfaces/SendResult.js";

export type DeliveryStrategy = (
  notification: Notification,
  senders: Sender[],
) => Promise<SendResult>;
