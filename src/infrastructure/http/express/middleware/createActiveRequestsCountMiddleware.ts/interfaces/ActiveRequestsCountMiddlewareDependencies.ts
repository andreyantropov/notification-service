import { Counter } from "../../../../../ports/Counter.js";

export interface ActiveRequestsCountMiddlewareDependencies {
  activeRequestsCounter: Counter;
}
