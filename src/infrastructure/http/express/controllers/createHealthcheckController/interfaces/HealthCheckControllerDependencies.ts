import { SendNotificationUseCase } from "../../../../../../application/useCases/createSendNotificationUseCase/index.js";

export interface HealthCheckDependencies {
  sendNotificationUseCase: SendNotificationUseCase;
}
