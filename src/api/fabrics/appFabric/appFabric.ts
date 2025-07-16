import express from "express";
import swaggerUi from "swagger-ui-express";
import { createNotificationController } from "../../controllers/notificationController/notificationController.js";
import { createValidateRequestSchemaMiddleware } from "../../middleware/validateRequestSchemaMiddleware/validateRequestSchemaMiddleware.js";
import { createDefaultMiddleware } from "../middlewareFabric/middlewareFabric.js";
import { createDefaultServer } from "../serverFabric.ts/serverFabric.js";
import { createDefaultSwagger } from "../swaggerFabric/swaggerFabric.js";
import { App } from "./interfaces/App.js";
import { AppFabricConfig } from "./interfaces/AppFabricConfig.js";
import { NotificationRequest } from "../../dtos/NotificationDTO.js";
import { createDefaultRouter } from "../routerFabric/index.js";
import { HttpMethod } from "../../enum/HttpMethod.js";
import { createHealthcheckController } from "../../controllers/healthcheckController/healthcheckController.js";

export const createDefaultApp = (config: AppFabricConfig): App => {
  const { serverConfig, sendNotificationUseCase, notificationLoggerService } =
    config;
  const {
    jsonParser,
    rateLimitMiddleware,
    loggerMiddleware,
    notFoundMiddleware,
    internalServerErrorMiddleware,
  } = createDefaultMiddleware({
    rateLimitConfig: {
      time: serverConfig.rateLimitTime,
      tries: serverConfig.rateLimitTries,
    },
    notificationLoggerService,
  });

  const notificationController = createNotificationController({
    sendNotificationUseCase,
  });
  const healthcheckController = createHealthcheckController({
    sendNotificationUseCase,
  });

  const validateRequestSchemaMiddleware = createValidateRequestSchemaMiddleware(
    { schema: NotificationRequest },
  );

  const router = createDefaultRouter([
    {
      method: HttpMethod.POST,
      path: "/v1/notifications",
      controller: notificationController.send,
      validate: validateRequestSchemaMiddleware,
    },
    {
      method: HttpMethod.GET,
      path: "/health/live",
      controller: healthcheckController.live,
    },
    {
      method: HttpMethod.GET,
      path: "/health/ready",
      controller: healthcheckController.ready,
    },
  ]);

  const { swaggerSpec } = createDefaultSwagger({ baseUrl: serverConfig.url });

  const app = express();

  app.use(jsonParser);
  app.use(loggerMiddleware);
  app.use(rateLimitMiddleware);
  app.use("/api", router);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(notFoundMiddleware);
  app.use(internalServerErrorMiddleware);

  const { start, stop } = createDefaultServer({
    app,
    port: serverConfig.port,
    notificationLoggerService,
  });

  return { start, stop };
};
