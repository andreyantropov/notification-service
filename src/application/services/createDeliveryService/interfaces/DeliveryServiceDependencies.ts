import type { Channel } from "../../../../domain/ports/index.js";

export interface DeliveryServiceDependencies {
  readonly channels: readonly Channel[];
}
