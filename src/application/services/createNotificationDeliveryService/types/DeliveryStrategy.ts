import { Notification } from "../../../../domain/interfaces/Notification.js";
import { NotificationSender } from "../../../../domain/interfaces/NotificationSender.js";
import { Recipient } from "../../../../domain/types/Recipient.js";

export type DeliveryStrategy = (
  senders: NotificationSender[],
  notification: Notification,
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void,
) => Promise<void>;
