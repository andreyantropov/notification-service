import { Logger } from "../../../../../ports/index.js";
import { NotificationDeliveryService } from "../../../interfaces/NotificationDeliveryService.js";

export interface LoggedNotificationDeliveryServiceDependencies {
  readonly notificationDeliveryService: NotificationDeliveryService;
  readonly logger: Logger;
}
