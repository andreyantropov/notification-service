import { Recipient } from "../../domain/types/Recipient.js";

export interface RawNotification {
  recipients: Recipient[];
  message: string;
  isUrgent?: boolean;
}
