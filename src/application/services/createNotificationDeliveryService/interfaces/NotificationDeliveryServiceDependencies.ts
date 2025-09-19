import { Sender } from "../../../../domain/ports/Sender.js";

export interface NotificationDeliveryServiceDependencies {
  senders: Sender[];
}
