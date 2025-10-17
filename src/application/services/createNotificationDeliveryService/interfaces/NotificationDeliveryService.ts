import { DeliveryResult } from "./DeliveryResult.js";
import { Notification } from "../../../../domain/types/Notification.js";

export interface NotificationDeliveryService {
  send: (notification: Notification[]) => Promise<DeliveryResult[]>;
  checkHealth?: () => Promise<void>;
}
