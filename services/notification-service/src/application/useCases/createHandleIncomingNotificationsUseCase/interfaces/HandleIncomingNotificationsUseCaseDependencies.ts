import type { Notification, Producer } from "@notification-platform/shared";
import type { DeliveryService } from "../../../services/createDeliveryService/index.js";
import type { Generator } from "../../../types/index.js";

export interface HandleIncomingNotificationsUseCaseDependencies {
  readonly producer: Producer<Notification>;
  readonly deliveryService: DeliveryService;
  readonly idGenerator: Generator;
}
