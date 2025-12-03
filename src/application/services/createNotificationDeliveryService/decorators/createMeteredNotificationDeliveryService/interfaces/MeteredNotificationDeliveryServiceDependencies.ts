import { Meter } from "../../../../../ports/index.js";
import { NotificationDeliveryService } from "../../../interfaces/NotificationDeliveryService.js";

export interface MeteredNotificationDeliveryServiceDependencies {
  readonly notificationDeliveryService: NotificationDeliveryService;
  readonly meter: Meter;
}
