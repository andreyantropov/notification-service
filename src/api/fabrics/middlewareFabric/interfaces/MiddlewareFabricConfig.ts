import { NotificationLoggerService } from "../../../../application/services/notificationLoggerService/index.js";

export interface MiddlewareFabricConfig {
  rateLimitConfig: { time: number; tries: number };
  notificationLoggerService: NotificationLoggerService;
}
