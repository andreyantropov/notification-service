import { NotificationStrategyLiteral } from "../../domain/types/NotificationStrategyLiteral.js";
import { Recipient } from "../../domain/types/Recipient.js";

export interface RawNotification {
  recipients: Recipient[];
  message: string;
  isUrgent?: boolean;
  strategy?: NotificationStrategyLiteral;
}
