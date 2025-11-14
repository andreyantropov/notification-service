import { Logger } from "../../../../../ports/Logger.js";
import { NotificationDeliveryService } from "../../../interfaces/NotificationDeliveryService.js";

export interface LoggedNotificationDeliveryServiceDependencies {
  notificationDeliveryService: NotificationDeliveryService;
  logger: Logger;
}
