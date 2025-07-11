import express from "express";
import swaggerUi from "swagger-ui-express";
import { createNotificationController } from "../../controllers/notificationController/notificationController.js";
import { createValidateRequestSchemaMiddleware } from "../../middleware/validateRequestSchemaMiddleware/validateRequestSchemaMiddleware.js";
import { createDefaultMiddlewares } from "../middlewareFabric/middlewareFabric.js";
import { createDefaultRouter } from "../routerFabric/routerFabric.js";
import { createDefaultServer } from "../serverFabric.ts/serverFabric.js";
import { createDefaultSwagger } from "../swaggerFabric/swaggerFabric.js";
import { AppFabric } from "./interfaces/AppFabric.js";
import { AppFabricConfig } from "./interfaces/AppFabricConfig.js";
import { NotificationRequest } from "../../dtos/NotificationDTO.js";

export const createDefaultApp = (config: AppFabricConfig): AppFabric => {
  const { serverConfig, sendNotificationUseCase, notificationLoggerService } =
    config;
  const {
    jsonParser,
    rateLimitMiddleware,
    loggerMiddleware,
    notFoundMiddleware,
    internalServerErrorMiddleware,
  } = createDefaultMiddlewares({
    rateLimitConfig: {
      time: serverConfig.rateLimitTime,
      tries: serverConfig.rateLimitTries,
    },
    notificationLoggerService,
  });

  const notificationController = createNotificationController({
    sendNotificationUseCase,
  });

  const validateRequestSchemaMiddleware = createValidateRequestSchemaMiddleware(
    { schema: NotificationRequest },
  );

  const routes = createDefaultRouter({
    path: "/v1/notifications",
    notificationController,
    validateMiddleware: validateRequestSchemaMiddleware,
  });

  const { swaggerSpec } = createDefaultSwagger({ baseUrl: serverConfig.url });

  const app = express();

  app.use(jsonParser);
  app.use(loggerMiddleware);
  app.use(rateLimitMiddleware);
  app.use("/api", routes.notificationRouter);
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
