import { CheckNotificationServiceHealthUseCase } from "../../../../../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";

export interface HealthCheckDependencies {
  checkNotificationServiceHealthUseCase: CheckNotificationServiceHealthUseCase;
}
