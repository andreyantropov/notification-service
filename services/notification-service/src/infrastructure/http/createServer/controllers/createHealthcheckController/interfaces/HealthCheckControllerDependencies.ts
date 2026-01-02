import type { CheckHealthUseCase } from "../../../../../../application/useCases/createCheckHealthUseCase/index.js";

export interface HealthCheckDependencies {
  readonly checkHealthUseCase: CheckHealthUseCase;
}
