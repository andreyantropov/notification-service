import { NotificationDeliveryService } from "../../../services/notificationDeliveryService/index.js";
import { NotificationLoggerService } from "../../../services/notificationLoggerService/index.js";

export interface SendNotificationUseCaseConfig {
  notificationDeliveryService: NotificationDeliveryService;
  notificationLoggerService: NotificationLoggerService;
}
