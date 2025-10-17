import { Notification } from "../../../../domain/types/Notification.js";
import { Buffer } from "../../../ports/Buffer.js";
import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";

export interface ProcessBufferedNotificationsUseCaseDependencies {
  buffer: Buffer<Notification>;
  notificationDeliveryService: NotificationDeliveryService;
}
