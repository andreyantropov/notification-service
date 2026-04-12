import { type Channel } from "../../../../../domain/ports/index.js";
import { type Tracer } from "../../../../telemetry/index.js";

export interface TracingDecoratorDependencies {
  readonly channel: Channel;
  readonly tracer: Tracer;
}
