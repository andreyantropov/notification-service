export interface SchedulerDependencies {
  task: () => Promise<void>;
}
