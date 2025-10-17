import { Channel } from "../../../../domain/ports/Channel.js";

export interface NotificationDeliveryServiceDependencies {
  channels: Channel[];
}
