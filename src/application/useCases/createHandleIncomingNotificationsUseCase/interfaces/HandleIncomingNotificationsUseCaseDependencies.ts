import { Notification } from "../../../../domain/types/Notification.js";
import { Producer } from "../../../ports/Producer.js";
import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";
import { Generator } from "../../../types/Generator.js";

export interface HandleIncomingNotificationsUseCaseDependencies {
  producer: Producer<Notification>;
  notificationDeliveryService: NotificationDeliveryService;
  idGenerator: Generator;
}
