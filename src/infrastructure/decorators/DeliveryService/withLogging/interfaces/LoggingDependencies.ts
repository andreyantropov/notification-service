import { type DeliveryService } from "../../../../../application/services/index.js";
import { type Logger } from "../../../../telemetry/index.js";

export interface LoggingDependencies {
  readonly deliveryService: DeliveryService;
  readonly logger: Logger;
}
