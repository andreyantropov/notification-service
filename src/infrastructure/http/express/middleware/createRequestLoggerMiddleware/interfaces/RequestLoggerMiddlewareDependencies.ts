import { LoggerAdapter } from "../../../../../../application/ports/LoggerAdapter.js";

export interface RequestLoggerMiddlewareDependencies {
  loggerAdapter: LoggerAdapter;
}
