import { ResolveRecipients } from "../../../../application/resolvers/recipient/types/ResolveRecipients";
import { NotificationSource } from "../../../../domain/interfaces/NotificationSource";
import { NotificationDeliveryService } from "../../notificationDeliveryService/interfaces/NotificationDeliveryService";
import { NotificationLoggerService } from "../../notificationLoggerService";

export interface NotificationProcessServiceConfig {
  notificationSource: NotificationSource;
  notificationDeliveryService: NotificationDeliveryService;
  notificationLogger: NotificationLoggerService;
  resolveRecipients?: ResolveRecipients;
}
