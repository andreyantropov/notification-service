import { Express } from "express";

import { Counter } from "../../../../ports/Counter.js";
import { LoggerAdapter } from "../../../../ports/LoggerAdapter.js";

export interface ServerDependencies {
  app: Express;
  activeRequestsCounter: Counter;
  loggerAdapter?: LoggerAdapter;
}
