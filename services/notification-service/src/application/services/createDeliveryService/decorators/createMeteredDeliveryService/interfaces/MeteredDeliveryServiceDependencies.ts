import type { Meter } from "@notification-platform/shared";
import type { DeliveryService } from "../../../interfaces/DeliveryService.js";

export interface MeteredDeliveryServiceDependencies {
  readonly deliveryService: DeliveryService;
  readonly meter: Meter;
}
