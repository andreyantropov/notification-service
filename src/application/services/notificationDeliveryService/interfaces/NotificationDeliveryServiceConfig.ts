import { NotificationSender } from "../../../../domain/interfaces/NotificationSender";

export interface NotificationDeliveryServiceConfig {
  sender: NotificationSender;
}
