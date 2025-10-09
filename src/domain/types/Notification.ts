import { NotificationStrategyLiteral } from "./NotificationStrategyLiteral.js";
import { Recipient } from "../types/Recipient.js";

export interface Notification {
  id: string;
  recipients: Recipient[];
  message: string;
  isUrgent?: boolean;
  strategy?: NotificationStrategyLiteral;
}
