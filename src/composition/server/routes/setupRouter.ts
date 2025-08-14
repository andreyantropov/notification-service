import { Express } from "express";
import { createHealthcheckController } from "../../../infrastructure/http/express/controllers/createHealthcheckController/createHealthcheckController.js";
import { createNotificationController } from "../../../infrastructure/http/express/controllers/createNotificationController/createNotificationController.js";
import { createValidateRequestSchemaMiddleware } from "../../../infrastructure/http/express/middleware/createValidateRequestSchemaMiddleware/createValidateRequestSchemaMiddleware.js";
import { getSendNotificationUseCaseInstance } from "../../core/useCases/getSendNotificationUseCaseInstance.js";
import { NotificationRequest } from "../../../api/schemas/NotificationRequest.js";

export const setupRouter = (app: Express) => {
  const sendNotificationUseCase = getSendNotificationUseCaseInstance();

  const notificationController = createNotificationController({
    sendNotificationUseCase,
  });
  const healthcheckController = createHealthcheckController({
    sendNotificationUseCase,
  });

  const validateNotificationRequestSchemaMiddleware =
    createValidateRequestSchemaMiddleware(NotificationRequest);

  app.post(
    "/api/v1/notifications",
    validateNotificationRequestSchemaMiddleware,
    notificationController.send,
  );
  app.get("/api/health/live", healthcheckController.live);
  app.get("/api/health/ready", healthcheckController.ready);
};
