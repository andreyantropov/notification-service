import { Notification } from "../../../../domain/types/Notification.js";
import { Buffer } from "../../../ports/Buffer.js";
import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";
import { Generator } from "../../../types/Generator.js";

export interface HandleIncomingNotificationsUseCaseDependencies {
  buffer: Buffer<Notification>;
  notificationDeliveryService: NotificationDeliveryService;
  idGenerator: Generator;
}
