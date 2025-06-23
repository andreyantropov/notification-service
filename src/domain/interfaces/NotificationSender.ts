import { Recipient } from "../types/Recipient.js";

export interface NotificationSender {
  isSupports: (recipient: Recipient) => boolean;
  send: (recipient: Recipient, message: string) => Promise<void>;
}
