import { NotificationLoggerService } from "../../../../application/services/notificationLoggerService/index.js";

export interface RequestLoggerMiddlewareConfig {
  notificationLoggerService: NotificationLoggerService;
}
