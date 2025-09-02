import { Counter } from "../../infrastructure/ports/Counter.js";
import { createActiveRequestCounter } from "../../infrastructure/counters/createActiveRequestCounter/createActiveRequestCounter.js";

let instance: Counter | null = null;

export const getActiveRequestCounterInstance = (): Counter => {
  if (!instance) {
    instance = createActiveRequestCounter();
  }
  return instance;
};
