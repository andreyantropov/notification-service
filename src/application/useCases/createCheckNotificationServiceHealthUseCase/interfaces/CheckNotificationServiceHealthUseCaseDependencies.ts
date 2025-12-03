import { Notification } from "../../../../domain/types/index.js";
import { Consumer, Producer } from "../../../ports/index.js";
import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";

export interface CheckNotificationServiceHealthUseCaseDependencies {
  readonly notificationDeliveryService: NotificationDeliveryService;
  readonly producer: Producer<Notification>;
  readonly batchConsumer: Consumer;
  readonly retryConsumer: Consumer;
}
