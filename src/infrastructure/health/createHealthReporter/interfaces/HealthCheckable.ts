export interface HealthCheckable {
  readonly checkHealth?: () => Promise<void>;
}
