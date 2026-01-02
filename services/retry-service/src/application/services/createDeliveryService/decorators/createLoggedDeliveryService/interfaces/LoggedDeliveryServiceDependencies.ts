import type { Logger } from "../../../../../ports/index.js";
import type { DeliveryService } from "../../../interfaces/DeliveryService.js";

export interface LoggedDeliveryServiceDependencies {
  readonly deliveryService: DeliveryService;
  readonly logger: Logger;
}
