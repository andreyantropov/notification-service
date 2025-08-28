import { createActiveRequestCounter } from "../../../infrastructure/counters/createActiveRequestCounter/index.js";
import { Counter } from "../../../application/ports/Counter.js";

let instance: Counter | null = null;

export const getActiveRequestCounterInstance = (): Counter => {
  if (!instance) {
    instance = createActiveRequestCounter();
  }
  return instance;
};
