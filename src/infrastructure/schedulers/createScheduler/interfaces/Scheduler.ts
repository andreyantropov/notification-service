export interface Scheduler {
  start(): void;
  shutdown(): Promise<void>;
}
