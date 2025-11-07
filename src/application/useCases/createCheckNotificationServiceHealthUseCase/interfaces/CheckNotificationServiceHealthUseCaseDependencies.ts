import { Notification } from "../../../../domain/types/Notification.js";
import { Consumer } from "../../../ports/Consumer.js";
import { Producer } from "../../../ports/Producer.js";
import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";

export interface CheckNotificationServiceHealthUseCaseDependencies {
  notificationDeliveryService: NotificationDeliveryService;
  producer: Producer<Notification>;
  batchConsumer: Consumer;
  retryConsumer: Consumer;
}
