import { type HealthService } from "../../../services/index.js";

export interface CheckLivenessUseCaseDependencies {
  readonly healthService: HealthService;
}
