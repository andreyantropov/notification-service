import { Recipient } from "../../../../domain/types/Recipient.js";

export interface NotificationDeliveryService {
  send: (recipients: Recipient[], message: string) => Promise<void>;
}
