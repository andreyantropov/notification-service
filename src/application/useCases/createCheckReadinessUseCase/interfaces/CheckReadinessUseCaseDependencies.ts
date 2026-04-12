import { type HealthService } from "../../../services/index.js";

export interface CheckReadinessUseCaseDependencies {
  readonly healthService: HealthService;
}
