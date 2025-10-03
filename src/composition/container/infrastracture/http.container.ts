import { asFunction, AwilixContainer } from "awilix";
import express from "express";
import swaggerUi from "swagger-ui-express";

import { getSwaggerSpec } from "../../../api/openapi/swagger.spec.js";
import { serverConfig } from "../../../configs/server.config.js";
import {
  createNotificationController,
  createHealthcheckController,
} from "../../../infrastructure/http/express/controllers/index.js";
import { createServer } from "../../../infrastructure/http/express/createServer/createServer.js";
import {
  createRateLimiterMiddleware,
  createRequestLoggerMiddleware,
  createActiveRequestsCounterMiddleware,
  createNotFoundMiddleware,
  createInternalServerErrorMiddleware,
} from "../../../infrastructure/http/express/middleware/index.js";
import { Container } from "../../types/Container.js";

export const registerHttp = (container: AwilixContainer<Container>) => {
  container.register({
    app: asFunction(
      ({ loggerAdapter, activeRequestsCounter, sendNotificationUseCase }) => {
        const app = express();

        app.use(express.json());

        const rateLimitMiddleware = createRateLimiterMiddleware({
          time: serverConfig.rateLimitTime,
          tries: serverConfig.rateLimitTries,
        });
        app.use(rateLimitMiddleware);

        const requestLoggerMiddleware = createRequestLoggerMiddleware({
          loggerAdapter,
        });
        app.use(requestLoggerMiddleware);

        const activeRequestsCounterMiddleware =
          createActiveRequestsCounterMiddleware({ activeRequestsCounter });
        app.use(activeRequestsCounterMiddleware);

        const notificationController = createNotificationController({
          sendNotificationUseCase,
        });
        const healthcheckController = createHealthcheckController({
          sendNotificationUseCase,
        });

        app.post("/api/v1/notifications", notificationController.send);
        app.get("/api/health/live", healthcheckController.live);
        app.get("/api/health/ready", healthcheckController.ready);

        const swaggerSpec = getSwaggerSpec({ baseUrl: serverConfig.url });
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        app.use(createNotFoundMiddleware());
        app.use(createInternalServerErrorMiddleware());

        return app;
      },
    ).singleton(),

    server: asFunction(({ app, activeRequestsCounter }) =>
      createServer(
        { app, activeRequestsCounter },
        {
          port: serverConfig.port,
          gracefulShutdownTimeout: serverConfig.gracefulShutdownTimeout,
        },
      ),
    ).singleton(),
  });
};
