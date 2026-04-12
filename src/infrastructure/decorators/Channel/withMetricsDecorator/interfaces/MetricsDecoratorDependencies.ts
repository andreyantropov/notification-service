import { type Channel } from "../../../../../domain/ports/index.js";
import { type Meter } from "../../../../telemetry/index.js";

export interface MetricsDecoratorDependencies {
  readonly channel: Channel;
  readonly meter: Meter;
}
