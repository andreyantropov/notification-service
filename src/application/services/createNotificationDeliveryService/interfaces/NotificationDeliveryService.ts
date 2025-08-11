import { Notification } from "../../../../domain/interfaces/Notification.js";

export interface NotificationDeliveryService {
  send: (notification: Notification) => Promise<void>;
  checkHealth?: () => Promise<void>;
}
