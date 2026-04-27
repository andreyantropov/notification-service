import { type ReceiveNotificationUseCase } from "../../../../../application/useCases/index.js";
import { type Logger } from "../../../../telemetry/index.js";

export interface LoggingDependencies {
  readonly receiveNotificationUseCase: ReceiveNotificationUseCase;
  readonly logger: Logger;
}
