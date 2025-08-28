import { Counter } from "../../../application/ports/Counter.js";

export const createActiveRequestCounter = (): Counter => {
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
