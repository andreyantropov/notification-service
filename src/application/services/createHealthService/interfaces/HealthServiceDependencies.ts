import { type HealthReporter } from "../../../ports/index.js";

export interface HealthServiceDependencies {
  readonly healthReporter: HealthReporter;
}
