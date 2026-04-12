import { type Meter } from "../../../../telemetry/index.js";

export interface MeterMiddlewareDependencies {
  readonly meter: Meter;
}
