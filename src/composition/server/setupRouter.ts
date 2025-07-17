import { Express } from "express";
import { createHealthcheckController } from "../../api/controllers/healthcheckController/healthcheckController.js";
import { createNotificationController } from "../../api/controllers/notificationController/notificationController.js";
import { NotificationRequest } from "../../api/dtos/NotificationDTO.js";
import { createValidateRequestSchemaMiddleware } from "../../api/middleware/validateRequestSchemaMiddleware/validateRequestSchemaMiddleware.js";
import { createDefaultSendNotificationUseCase } from "../core/sendNotificationUseCase.js";

export const setupRouter = (app: Express) => {
  const sendNotificationUseCase = createDefaultSendNotificationUseCase();

  const notificationController = createNotificationController({
    sendNotificationUseCase,
  });
  const healthcheckController = createHealthcheckController({
    sendNotificationUseCase,
  });

  const validateRequestSchemaMiddleware = createValidateRequestSchemaMiddleware(
    { schema: NotificationRequest },
  );

  app.post(
    "/api/v1/notifications",
    validateRequestSchemaMiddleware,
    notificationController.send,
  );
  app.get("/api/health/live", healthcheckController.live);
  app.get("/api/health/ready", healthcheckController.ready);
};
