import { type HealthReporter } from "../../../application/ports/index.js";

import { type HealthReporterDependnencies } from "./interfaces/index.js";

export const createHealthReporter = (
  dependencies: HealthReporterDependnencies,
): HealthReporter => {
  const { objects } = dependencies;

  const checkHealth = async (): Promise<void> => {
    const promises = [];

    for (const object of objects) {
      if (object.checkHealth) {
        promises.push(object.checkHealth());
      }
    }

    await Promise.all(promises);
  };

  return {
    checkHealth,
  };
};
