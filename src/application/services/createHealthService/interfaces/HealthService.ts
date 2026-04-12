export interface HealthService {
  readonly checkLiveness: () => Promise<void>;
  readonly checkReadiness: () => Promise<void>;
}
