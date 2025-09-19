import { Express } from "express";

import { LoggerAdapter } from "../../../../../application/ports/LoggerAdapter.js";
import { Counter } from "../../../../ports/Counter.js";

export interface ServerDependencies {
  app: Express;
  activeRequestsCounter: Counter;
  loggerAdapter?: LoggerAdapter;
}
