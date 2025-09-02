import { Counter } from "../../../../ports/Counter.js";

export interface ServerDependencies {
  activeRequestsCounter: Counter;
}
