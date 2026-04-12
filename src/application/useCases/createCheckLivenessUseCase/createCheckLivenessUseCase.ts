import {
  type CheckLivenessUseCase,
  type CheckLivenessUseCaseDependencies,
} from "./interfaces/index.js";

export const createCheckLivenessUseCase = (
  dependencies: CheckLivenessUseCaseDependencies,
): CheckLivenessUseCase => {
  const { healthService } = dependencies;

  const execute = async (): Promise<void> => {
    await healthService.checkLiveness();
  };

  return {
    execute,
  };
};
