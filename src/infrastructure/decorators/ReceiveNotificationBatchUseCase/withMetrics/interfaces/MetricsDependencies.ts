import { type ReceiveNotificationBatchUseCase } from "../../../../../application/useCases/index.js";
import { type Meter } from "../../../../telemetry/index.js";

export interface MetricsDependencies {
  readonly receiveNotificationBatchUseCase: ReceiveNotificationBatchUseCase;
  readonly meter: Meter;
}
