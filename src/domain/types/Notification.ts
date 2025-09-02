import { Recipient } from "../types/Recipient.js";

export interface Notification {
  recipients: Recipient[];
  message: string;
  isUrgent?: boolean;
}
