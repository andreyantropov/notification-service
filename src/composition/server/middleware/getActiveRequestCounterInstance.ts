import { ActiveRequestsCounter } from "../../../shared/interfaces/ActiveRequestsCounter.js";

const createActiveRequestCounter = (): ActiveRequestsCounter => {
  let count = 0;

  const getValue = () => count;

  const increase = () => {
    count++;
  };

  const decrease = () => {
    if (count > 0) count--;
  };

  return {
    get value() {
      return getValue();
    },
    increase,
    decrease,
  };
};

let instance: ActiveRequestsCounter | null = null;

export const getActiveRequestCounterInstance = (): ActiveRequestsCounter => {
  if (!instance) {
    instance = createActiveRequestCounter();
  }
  return instance;
};
