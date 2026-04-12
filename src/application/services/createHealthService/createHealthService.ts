import {
  type HealthService,
  type HealthServiceDependencies,
} from "./interfaces/index.js";

export const createHealthService = (
  dependencies: HealthServiceDependencies,
): HealthService => {
  const { healthReporter } = dependencies;

  const checkLiveness = async (): Promise<void> => {};

  const checkReadiness = async (): Promise<void> => {
    await healthReporter.checkHealth();
  };

  return {
    checkLiveness,
    checkReadiness,
  };
};
