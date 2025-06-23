import { NotificationSender } from "../../../../domain/interfaces/NotificationSender.js";

export interface NotificationDeliveryServiceConfig {
  sender: NotificationSender;
}
