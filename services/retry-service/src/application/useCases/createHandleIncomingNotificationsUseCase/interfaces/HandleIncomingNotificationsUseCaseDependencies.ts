import type { Notification } from "../../../../domain/types/index.js";
import type { Producer } from "../../../ports/index.js";
import type { DeliveryService } from "../../../services/createDeliveryService/index.js";
import type { Generator } from "../../../types/index.js";

export interface HandleIncomingNotificationsUseCaseDependencies {
  readonly producer: Producer<Notification>;
  readonly deliveryService: DeliveryService;
  readonly idGenerator: Generator;
}
