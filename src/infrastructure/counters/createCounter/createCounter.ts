import { Counter } from "../../ports/Counter.js";

export const createCounter = (): Counter => {
  let count = 0;

  const getValue = (): number => count;

  const increase = (): void => {
    count++;
  };

  const decrease = (): void => {
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
