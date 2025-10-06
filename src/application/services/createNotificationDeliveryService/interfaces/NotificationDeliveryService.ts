import { SendResult } from "./SendResult.js";
import { Notification } from "../../../../domain/types/Notification.js";

export interface NotificationDeliveryService {
  send: (notification: Notification[]) => Promise<SendResult[]>;
  checkHealth?: () => Promise<void>;
}
