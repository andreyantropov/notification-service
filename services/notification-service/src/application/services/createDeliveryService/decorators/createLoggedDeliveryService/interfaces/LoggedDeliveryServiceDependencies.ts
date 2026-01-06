import type { Logger } from "@notification-platform/shared";
import type { DeliveryService } from "../../../interfaces/DeliveryService.js";

export interface LoggedDeliveryServiceDependencies {
  readonly deliveryService: DeliveryService;
  readonly logger: Logger;
}
