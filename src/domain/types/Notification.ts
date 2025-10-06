import { Recipient } from "../types/Recipient.js";

export interface Notification {
  id: string;
  recipients: Recipient[];
  message: string;
  isUrgent?: boolean;
}
