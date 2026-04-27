import { type Server } from "../../../../http/index.js";
import { type Logger } from "../../../../telemetry/index.js";

export interface LoggingDependencies {
  readonly server: Server;
  readonly logger: Logger;
}
