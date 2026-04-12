import {
  type CheckLivenessUseCase,
  type CheckReadinessUseCase,
} from "../../../../../application/useCases/index.js";

export interface HealthControllerDependencies {
  readonly checkLivenessUseCase: CheckLivenessUseCase;
  readonly checkReadinessUseCase: CheckReadinessUseCase;
}
