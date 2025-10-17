import { Scheduler } from "./interfaces/Scheduler.js";
import { SchedulerConfig } from "./interfaces/SchedulerConfig.js";
import { SchedulerDependencies } from "./interfaces/SchedulerDependencies.js";

const DEFAULT_INTERVAL = 60_000;
const CHECK_IS_PROCESSING_TIMEOUT = 100;

export const createScheduler = (
  dependencies: SchedulerDependencies,
  config: SchedulerConfig,
): Scheduler => {
  const { task } = dependencies;
  const { interval = DEFAULT_INTERVAL, onError = () => {} } = config;

  let timer: ReturnType<typeof setInterval> | null = null;
  let isProcessing = false;
  let isShuttingDown = false;

  const run = async (): Promise<void> => {
    if (isProcessing || isShuttingDown) return;

    isProcessing = true;
    try {
      await task();
    } catch (error) {
      onError(
        new Error("В ходе работы планировщика произошла ошибка", {
          cause: error,
        }),
      );
    } finally {
      isProcessing = false;
    }
  };

  const start = (): void => {
    if (timer) return;
    isShuttingDown = false;
    timer = setInterval(run, interval);
  };

  const shutdown = async (): Promise<void> => {
    isShuttingDown = true;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    while (isProcessing) {
      await new Promise((resolve) =>
        setTimeout(resolve, CHECK_IS_PROCESSING_TIMEOUT),
      );
    }
  };

  return {
    start,
    shutdown,
  };
};
