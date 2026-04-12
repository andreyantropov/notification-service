export interface HealthReporter {
  readonly checkHealth: () => Promise<void>;
}
