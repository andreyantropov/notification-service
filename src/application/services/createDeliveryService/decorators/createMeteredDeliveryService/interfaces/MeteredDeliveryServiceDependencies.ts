import type { Meter } from "../../../../../ports/index.js";
import type { DeliveryService } from "../../../interfaces/DeliveryService.js";

export interface MeteredDeliveryServiceDependencies {
  readonly deliveryService: DeliveryService;
  readonly meter: Meter;
}
