import { type Tracer } from "../../../../telemetry/index.js";

export interface TracerMiddlewareDependencies {
  readonly tracer: Tracer;
}
