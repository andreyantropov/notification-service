import { ActiveRequestsCounter } from "../../api/middleware/activeRequestsCounterMiddleware.ts/index.js";

const createDefaultActiveRequestCounter = (): ActiveRequestsCounter => {
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

export const getDefaultActiveRequestCounter = (): ActiveRequestsCounter => {
  if (!instance) {
    instance = createDefaultActiveRequestCounter();
  }
  return instance;
};
