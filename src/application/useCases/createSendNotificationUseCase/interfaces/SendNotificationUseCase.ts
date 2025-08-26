import { Notification } from "../../../../domain/interfaces/Notification.js";
import { SendResult } from "../../../services/createNotificationDeliveryService/index.js";

export interface SendNotificationUseCase {
  send: (notification: Notification | Notification[]) => Promise<SendResult[]>;
  checkHealth?: () => Promise<void>;
}
