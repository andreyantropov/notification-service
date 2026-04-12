import { type ReceiveNotificationUseCase } from "../../../../../application/useCases/index.js";
import { type Meter } from "../../../../telemetry/index.js";

export interface MetricsDecoratorDependencies {
  readonly receiveNotificationUseCase: ReceiveNotificationUseCase;
  readonly meter: Meter;
}
