import { asFunction, AwilixContainer } from "awilix";
import express from "express";
import expressAsyncHandler from "express-async-handler";
import swaggerUi from "swagger-ui-express";

import { authConfig, serverConfig } from "../../../configs/index.js";
import {
  createRateLimiterMiddleware,
  createRequestLoggerMiddleware,
  createAuthenticationMiddleware,
  createAuthorizationMiddleware,
  createNotificationController,
  createHealthcheckController,
  createNotFoundMiddleware,
  createInternalServerErrorMiddleware,
  createServer,
} from "../../../infrastructure/http/express/index.js";
import { createLoggedServer } from "../../../infrastructure/http/index.js";
import { getSwagger } from "../../../ui/openapi/swagger.js";
import { Container } from "../../types/Container.js";

export const registerHttp = (container: AwilixContainer<Container>) => {
  container.register({
    app: asFunction(
      ({
        logger,
        handleIncomingNotificationsUseCase,
        checkNotificationServiceHealthUseCase,
      }) => {
        const app = express();

        app.use(express.json());

        const rateLimitMiddleware = createRateLimiterMiddleware({
          time: serverConfig.rateLimitTime,
          tries: serverConfig.rateLimitTries,
        });
        app.use(rateLimitMiddleware);

        const requestLoggerMiddleware = createRequestLoggerMiddleware({
          logger,
        });
        app.use(requestLoggerMiddleware);

        const healthcheckController = createHealthcheckController({
          checkNotificationServiceHealthUseCase,
        });
        app.get(
          "/api/health/live",
          expressAsyncHandler(healthcheckController.live),
        );
        app.get(
          "/api/health/ready",
          expressAsyncHandler(healthcheckController.ready),
        );

        const authenticationMiddleware = createAuthenticationMiddleware({
          issuer: authConfig.issuer,
          jwksUri: authConfig.jwksUri,
          audience: authConfig.audience,
          tokenSigningAlg: authConfig.tokenSigningAlg,
        });
        const authorizationMiddleware = createAuthorizationMiddleware({
          serviceClientId: authConfig.serviceClientId,
          requiredRoles: authConfig.requiredRoles,
        });
        const notificationController = createNotificationController({
          handleIncomingNotificationsUseCase,
        });
        app.post(
          "/api/v1/notifications",
          authenticationMiddleware,
          authorizationMiddleware,
          expressAsyncHandler(notificationController.send),
        );

        const swaggerSpec = getSwagger({ baseUrl: serverConfig.url });
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        const notFoundMiddleware = createNotFoundMiddleware();
        app.use(notFoundMiddleware);

        const internalServerErrorMiddleware =
          createInternalServerErrorMiddleware();
        app.use(internalServerErrorMiddleware);

        return app;
      },
    ).singleton(),

    server: asFunction(({ app, logger }) => {
      const server = createServer(
        { app },
        {
          port: serverConfig.port,
        },
      );
      const loggerServer = createLoggedServer({ server, logger });

      return loggerServer;
    }).singleton(),
  });
};
