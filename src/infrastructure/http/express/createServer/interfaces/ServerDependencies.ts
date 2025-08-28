import { Counter } from "../../../../../application/ports/Counter.js";

export interface ServerDependencies {
  activeRequestsCounter: Counter;
}
