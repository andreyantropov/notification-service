import { Notification } from "../../../../domain/interfaces/Notification.js";
import { SendResult } from "../types/SendResult.js";

export interface NotificationDeliveryService {
  send: (notification: Notification | Notification[]) => Promise<SendResult[]>;
  checkHealth?: () => Promise<void>;
}
