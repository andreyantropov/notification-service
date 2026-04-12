import { type DeliveryService } from "../../../../../application/services/index.js";
import { type Meter } from "../../../../telemetry/index.js";

export interface MetricsDecoratorDependencies {
  readonly deliveryService: DeliveryService;
  readonly meter: Meter;
}
