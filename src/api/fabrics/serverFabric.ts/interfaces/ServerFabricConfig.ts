import { Express } from "express";
import { NotificationLoggerService } from "../../../../application/services/notificationLoggerService/index.js";

export interface ServerFabricConfig {
  app: Express;
  port: number;
  notificationLoggerService: NotificationLoggerService;
}
