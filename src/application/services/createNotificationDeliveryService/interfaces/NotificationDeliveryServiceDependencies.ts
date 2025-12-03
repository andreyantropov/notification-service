import { Channel } from "../../../../domain/ports/index.js";

export interface NotificationDeliveryServiceDependencies {
  readonly channels: readonly Channel[];
}
