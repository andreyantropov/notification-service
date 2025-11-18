import { Meter } from "../../../../../ports/Meter.js";
import { NotificationDeliveryService } from "../../../interfaces/NotificationDeliveryService.js";

export interface MeteredNotificationDeliveryServiceDependencies {
  notificationDeliveryService: NotificationDeliveryService;
  meter: Meter;
}
