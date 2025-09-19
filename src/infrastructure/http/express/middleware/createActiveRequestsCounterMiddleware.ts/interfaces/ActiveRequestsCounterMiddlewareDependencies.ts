import { Counter } from "../../../../../ports/Counter.js";

export interface ActiveRequestsCounterMiddlewareDependencies {
  activeRequestsCounter: Counter;
}
