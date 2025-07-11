import { RequestHandler } from "express";
import { NotificationController } from "../../../controllers/notificationController/index.js";

export interface RouterFabricConfig {
  path: string;
  validateMiddleware: RequestHandler;
  notificationController: NotificationController;
}
