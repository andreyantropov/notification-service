import { Notification } from "../../../../domain/types/index.js";
import { Producer } from "../../../ports/index.js";
import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";
import { Generator } from "../../../types/index.js";

export interface HandleIncomingNotificationsUseCaseDependencies {
  readonly producer: Producer<Notification>;
  readonly notificationDeliveryService: NotificationDeliveryService;
  readonly idGenerator: Generator;
}
