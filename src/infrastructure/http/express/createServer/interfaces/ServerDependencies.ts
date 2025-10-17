import { Express } from "express";

import { Counter } from "../../../../ports/Counter.js";

export interface ServerDependencies {
  app: Express;
  activeRequestsCounter: Counter;
}
