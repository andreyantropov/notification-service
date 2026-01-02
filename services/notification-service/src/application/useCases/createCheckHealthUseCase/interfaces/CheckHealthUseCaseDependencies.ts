import type { Notification } from "../../../../domain/types/index.js";
import type { Consumer, Producer } from "../../../ports/index.js";
import type { DeliveryService } from "../../../services/createDeliveryService/index.js";

export interface CheckHealthUseCaseDependencies {
  readonly deliveryService: DeliveryService;
  readonly producer: Producer<Notification>;
  readonly batchConsumer: Consumer;
  readonly retryConsumer: Consumer;
}
