import { NotificationLoggerService } from "../../../../application/services/notificationLoggerService/index.js";
import { SendNotificationUseCase } from "../../../../application/useCases/sendNotificationUseCase/index.js";
import { ServerConfig } from "./ServerConfig.js";

export interface AppFabricConfig {
  serverConfig: ServerConfig;
  sendNotificationUseCase: SendNotificationUseCase;
  notificationLoggerService: NotificationLoggerService;
}
