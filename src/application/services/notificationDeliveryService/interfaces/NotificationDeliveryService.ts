import { Recipient } from "../../../../domain/types/Recipient";

export interface NotificationDeliveryService {
  send: (recipients: Recipient[], message: string) => Promise<void>;
}
