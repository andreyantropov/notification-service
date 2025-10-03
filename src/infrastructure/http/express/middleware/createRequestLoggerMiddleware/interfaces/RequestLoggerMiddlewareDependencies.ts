import { LoggerAdapter } from "../../../../../ports/LoggerAdapter.js";

export interface RequestLoggerMiddlewareDependencies {
  loggerAdapter: LoggerAdapter;
}
