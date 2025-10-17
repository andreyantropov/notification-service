export interface SchedulerConfig {
  interval?: number;
  onError?: (error: Error) => void;
}
