import { asFunction, AwilixContainer } from "awilix";
import express from "express";
import expressAsyncHandler from "express-async-handler";
import swaggerUi from "swagger-ui-express";

import {
  authenticationMiddlewareConfig,
  authorizationMiddlewareConfig,
  healthcheckControllerConfig,
  serviceConfig,
  rateLimiterMiddlewareConfig,
  notificationControllerConfig,
} from "../../configs/index.js";
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
  createTimeoutErrorMiddleware,
} from "../../infrastructure/http/index.js";
import { createLoggedServer } from "../../infrastructure/http/index.js";
import { createSwaggerSpecification } from "../../presentation/createSwaggerSpecification/index.js";
import { Container } from "../types/index.js";

export const registerHttp = (container: AwilixContainer<Container>) => {
  container.register({
    rateLimiterMiddleware: asFunction(() => {
      const rateLimiterMiddleware = createRateLimiterMiddleware(
        rateLimiterMiddlewareConfig,
      );

      return rateLimiterMiddleware;
    }).singleton(),
    requestLoggerMiddleware: asFunction(({ logger }) => {
      const requestLoggerMiddleware = createRequestLoggerMiddleware({ logger });

      return requestLoggerMiddleware;
    }).singleton(),
    authenticationMiddleware: asFunction(() => {
      const authenticationMiddleware = createAuthenticationMiddleware(
        authenticationMiddlewareConfig,
      );

      return authenticationMiddleware;
    }).singleton(),
    authorizationMiddleware: asFunction(() => {
      const authorizationMiddleware = createAuthorizationMiddleware(
        authorizationMiddlewareConfig,
      );

      return authorizationMiddleware;
    }).singleton(),
    notFoundMiddleware: asFunction(() => {
      const notFoundMiddleware = createNotFoundMiddleware();

      return notFoundMiddleware;
    }).singleton(),
    timeoutErrorMiddleware: asFunction(() => {
      const timeoutErrorMiddleware = createTimeoutErrorMiddleware();

      return timeoutErrorMiddleware;
    }).singleton(),
    internalServerErrorMiddleware: asFunction(() => {
      const internalServerMiddleware = createInternalServerErrorMiddleware();

      return internalServerMiddleware;
    }).singleton(),
    healthcheckController: asFunction(
      ({ checkNotificationServiceHealthUseCase }) => {
        const healthcheckController = createHealthcheckController(
          { checkNotificationServiceHealthUseCase },
          healthcheckControllerConfig,
        );

        return healthcheckController;
      },
    ).singleton(),
    notificationController: asFunction(
      ({ handleIncomingNotificationsUseCase }) => {
        const notificationController = createNotificationController(
          {
            handleIncomingNotificationsUseCase,
          },
          notificationControllerConfig,
        );

        return notificationController;
      },
    ).singleton(),
    swaggerSpecification: asFunction(() => {
      const { title, version, publicUrl, description } = serviceConfig;

      const swaggerSpecification = createSwaggerSpecification({
        title,
        version,
        url: publicUrl,
        description,
      });

      return swaggerSpecification;
    }).singleton(),
    server: asFunction(
      ({
        rateLimiterMiddleware,
        requestLoggerMiddleware,
        healthcheckController,
        authenticationMiddleware,
        authorizationMiddleware,
        notificationController,
        swaggerSpecification,
        notFoundMiddleware,
        timeoutErrorMiddleware,
        internalServerErrorMiddleware,
        logger,
      }) => {
        const app = express();

        app.use(express.json());
        app.use(rateLimiterMiddleware);
        app.use(requestLoggerMiddleware);

        app.get(
          "/api/health/live",
          expressAsyncHandler(healthcheckController.live),
        );
        app.get(
          "/api/health/ready",
          expressAsyncHandler(healthcheckController.ready),
        );

        app.post(
          "/api/v1/notifications",
          authenticationMiddleware,
          authorizationMiddleware,
          expressAsyncHandler(notificationController.send),
        );

        app.use(
          "/api-docs",
          swaggerUi.serve,
          swaggerUi.setup(swaggerSpecification),
        );

        app.use(notFoundMiddleware);
        app.use(timeoutErrorMiddleware);
        app.use(internalServerErrorMiddleware);

        const { port } = serviceConfig;

        const server = createServer(
          { app },
          {
            port,
          },
        );
        const loggerServer = createLoggedServer({ server, logger });

        return loggerServer;
      },
    ).singleton(),
  });
};
