import { type Logger } from "../../../../telemetry/index.js";

export interface LoggerMiddlewareDependencies {
  readonly logger: Logger;
}
