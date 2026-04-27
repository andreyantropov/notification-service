import { type Channel } from "../../../../../domain/ports/index.js";
import { type Tracer } from "../../../../telemetry/index.js";

export interface TracingDependencies {
  readonly channel: Channel;
  readonly tracer: Tracer;
}
