import { CheckNotificationServiceHealthUseCase } from "../../../../../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";

export interface HealthCheckDependencies {
  readonly checkNotificationServiceHealthUseCase: CheckNotificationServiceHealthUseCase;
}
