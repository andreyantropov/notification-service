import { type HealthCheckable } from "./HealthCheckable.js";

export interface HealthReporterDependnencies {
  readonly objects: readonly HealthCheckable[];
}
