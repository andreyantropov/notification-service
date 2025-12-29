import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";
import express from "express";
import expressAsyncHandler from "express-async-handler";
import swaggerUi from "swagger-ui-express";

import {
  authenticationMiddlewareConfig,
  authorizationMiddlewareConfig,
  healthcheckControllerConfig,
  serviceConfig,
  notificationControllerConfig,
} from "../../configs/index.js";
import {
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
import type { Container } from "../types/index.js";

export const registerHttp = (container: AwilixContainer<Container>) => {
  container.register({
    requestLoggerMiddleware: asFunction(({ logger }) => {
      const requestLoggerMiddleware = createRequestLoggerMiddleware({ logger });

      return requestLoggerMiddleware;
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
    authenticationMiddleware: asFunction(() => {
      return authenticationMiddlewareConfig
        ? createAuthenticationMiddleware(authenticationMiddlewareConfig)
        : undefined;
    }).singleton(),
    authorizationMiddleware: asFunction(() => {
      return authorizationMiddlewareConfig
        ? createAuthorizationMiddleware(authorizationMiddlewareConfig)
        : undefined;
    }).singleton(),
    healthcheckController: asFunction(({ checkHealthUseCase }) => {
      const healthcheckController = createHealthcheckController(
        { checkHealthUseCase },
        healthcheckControllerConfig,
      );

      return healthcheckController;
    }).singleton(),
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
        requestLoggerMiddleware,
        authenticationMiddleware,
        authorizationMiddleware,
        healthcheckController,
        notificationController,
        swaggerSpecification,
        notFoundMiddleware,
        timeoutErrorMiddleware,
        internalServerErrorMiddleware,
        logger,
      }) => {
        const app = express();

        app.use(express.json());
        app.use(requestLoggerMiddleware);

        app.get(
          "/api/health/live",
          expressAsyncHandler(healthcheckController.live),
        );
        app.get(
          "/api/health/ready",
          expressAsyncHandler(healthcheckController.ready),
        );

        const notificationMiddleware: express.RequestHandler[] = [];
        if (authenticationMiddleware) {
          notificationMiddleware.push(authenticationMiddleware);
        }
        if (authorizationMiddleware) {
          notificationMiddleware.push(authorizationMiddleware);
        }

        app.post(
          "/api/v1/notifications",
          ...notificationMiddleware,
          expressAsyncHandler(notificationController.handle),
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
        const server = createServer({ app }, { port });
        const loggerServer = createLoggedServer({ server, logger });

        return loggerServer;
      },
    ).singleton(),
  });
};
