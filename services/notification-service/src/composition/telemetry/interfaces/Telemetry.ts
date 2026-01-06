export interface Telemetry {
  readonly start: () => void;
  readonly shutdown: () => Promise<void>;
}
