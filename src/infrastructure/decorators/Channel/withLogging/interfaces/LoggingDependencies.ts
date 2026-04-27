import { type Channel } from "../../../../../domain/ports/index.js";
import { type Logger } from "../../../../telemetry/index.js";

export interface LoggingDependencies {
  readonly channel: Channel;
  readonly logger: Logger;
}
