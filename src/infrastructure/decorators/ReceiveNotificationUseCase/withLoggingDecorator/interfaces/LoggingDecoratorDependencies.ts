import { type ReceiveNotificationUseCase } from "../../../../../application/useCases/index.js";
import { type Logger } from "../../../../telemetry/index.js";

export interface LoggingDecoratorDependencies {
  readonly receiveNotificationUseCase: ReceiveNotificationUseCase;
  readonly logger: Logger;
}
