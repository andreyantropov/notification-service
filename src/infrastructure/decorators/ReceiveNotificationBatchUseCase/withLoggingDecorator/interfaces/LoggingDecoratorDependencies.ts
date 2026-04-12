import { type ReceiveNotificationBatchUseCase } from "../../../../../application/useCases/index.js";
import { type Logger } from "../../../../telemetry/index.js";

export interface LoggingDecoratorDependencies {
  readonly receiveNotificationBatchUseCase: ReceiveNotificationBatchUseCase;
  readonly logger: Logger;
}
