import { Express } from "express";
import { getSendNotificationUseCaseInstance } from "../../core/useCases/getSendNotificationUseCaseInstance.js";
import {
  createNotificationController,
  createHealthcheckController,
} from "../../../infrastructure/http/express/controllers/index.js";

export const setupRouter = (app: Express) => {
  const sendNotificationUseCase = getSendNotificationUseCaseInstance();

  const notificationController = createNotificationController({
    sendNotificationUseCase,
  });
  const healthcheckController = createHealthcheckController({
    sendNotificationUseCase,
  });

  app.post("/api/v1/notifications", notificationController.send);
  app.get("/api/health/live", healthcheckController.live);
  app.get("/api/health/ready", healthcheckController.ready);
};
