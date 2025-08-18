import { Recipient } from "../../../../domain/types/Recipient.js";

export interface NotificationDeliveryServiceConfig {
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void;
}
