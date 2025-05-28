import { Recipient } from "../../../../domain/types/Recipient";
import { NotificationSender } from "../../../../domain/interfaces/NotificationSender";

export interface FallbackSenderConfig {
  senders: NotificationSender[];
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void;
}
