import { Notification } from "../../../../domain/types/Notification.js";
import { SendResult } from "../types/SendResult.js";

export interface NotificationDeliveryService {
  send: (notification: Notification | Notification[]) => Promise<SendResult[]>;
  checkHealth?: () => Promise<void>;
}
