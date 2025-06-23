import { Recipient } from "../../../../domain/types/Recipient.js";
import { NotificationSender } from "../../../../domain/interfaces/NotificationSender.js";

export interface FallbackSenderConfig {
  senders: NotificationSender[];
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void;
}
