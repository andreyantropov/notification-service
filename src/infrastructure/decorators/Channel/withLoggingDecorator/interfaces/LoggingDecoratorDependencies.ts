import { type Channel } from "../../../../../domain/ports/index.js";
import { type Logger } from "../../../../telemetry/index.js";

export interface LoggingDecoratorDependencies {
  readonly channel: Channel;
  readonly logger: Logger;
}
