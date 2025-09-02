import { Notification } from "../../../../domain/types/Notification.js";
import { Sender } from "../../../../domain/ports/Sender.js";
import { Recipient } from "../../../../domain/types/Recipient.js";

export type DeliveryStrategy = (
  senders: Sender[],
  notification: Notification,
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void,
) => Promise<void>;
