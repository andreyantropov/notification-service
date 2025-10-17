import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";

export interface CheckNotificationServiceHealthUseCaseDependencies {
  notificationDeliveryService: NotificationDeliveryService;
}
