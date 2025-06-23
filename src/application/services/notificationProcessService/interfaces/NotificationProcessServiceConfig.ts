import { ResolveRecipients } from "../../../../application/resolvers/recipient/types/ResolveRecipients.js";
import { NotificationSource } from "../../../../domain/interfaces/NotificationSource.js";
import { NotificationDeliveryService } from "../../notificationDeliveryService/interfaces/NotificationDeliveryService.js";
import { NotificationLoggerService } from "../../notificationLoggerService/index.js";

export interface NotificationProcessServiceConfig {
  notificationSource: NotificationSource;
  notificationDeliveryService: NotificationDeliveryService;
  notificationLogger: NotificationLoggerService;
  resolveRecipients?: ResolveRecipients;
}
