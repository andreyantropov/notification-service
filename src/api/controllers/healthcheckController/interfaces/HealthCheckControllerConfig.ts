import { SendNotificationUseCase } from "../../../../application/useCases/sendNotificationUseCase/index.js";

export interface HealthCheckControllerConfig {
  sendNotificationUseCase: SendNotificationUseCase;
}
