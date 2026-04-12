import { type ReceiveNotificationBatchUseCase } from "../../../../../application/useCases/index.js";
import { type Meter } from "../../../../telemetry/index.js";

export interface MetricsDecoratorDependencies {
  readonly receiveNotificationBatchUseCase: ReceiveNotificationBatchUseCase;
  readonly meter: Meter;
}
