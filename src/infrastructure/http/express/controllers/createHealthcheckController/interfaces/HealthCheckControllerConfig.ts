import { SendNotificationUseCase } from "../../../../../../application/useCases/createSendNotificationUseCase/index.js";

export interface HealthCheckControllerConfig {
  sendNotificationUseCase: SendNotificationUseCase;
}
