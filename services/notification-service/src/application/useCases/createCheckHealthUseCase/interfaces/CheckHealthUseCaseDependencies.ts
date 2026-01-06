import type { Notification, Consumer, Producer } from "@notification-platform/shared";
import type { DeliveryService } from "../../../services/createDeliveryService/index.js";

export interface CheckHealthUseCaseDependencies {
  readonly deliveryService: DeliveryService;
  readonly producer: Producer<Notification>;
  readonly batchConsumer: Consumer;
}
