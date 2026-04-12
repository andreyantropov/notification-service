import { type DeliveryService } from "../../../../../application/services/index.js";
import { type Logger } from "../../../../telemetry/index.js";

export interface LoggingDecoratorDependencies {
  readonly deliveryService: DeliveryService;
  readonly logger: Logger;
}
