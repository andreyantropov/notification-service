import { Logger } from "../../../../../../application/ports/index.js";

export interface RequestLoggerMiddlewareDependencies {
  readonly logger: Logger;
}
