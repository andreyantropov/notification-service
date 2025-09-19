import { Notification } from "../../../../domain/types/Notification.js";
import { Buffer } from "../../../ports/Buffer.js";
import { LoggerAdapter } from "../../../ports/LoggerAdapter.js";
import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";

export interface SendNotificationProcessDependencies {
  buffer: Buffer<Notification>;
  notificationDeliveryService: NotificationDeliveryService;
  loggerAdapter?: LoggerAdapter;
}
