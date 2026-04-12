import {
  type CheckReadinessUseCase,
  type CheckReadinessUseCaseDependencies,
} from "./interfaces/index.js";

export const createCheckReadinessUseCase = (
  dependencies: CheckReadinessUseCaseDependencies,
): CheckReadinessUseCase => {
  const { healthService } = dependencies;

  const execute = async (): Promise<void> => {
    await healthService.checkReadiness();
  };

  return {
    execute,
  };
};
