import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";
import express from "express";
import expressAsyncHandler from "express-async-handler";

import {
  healthcheckControllerConfig,
  serviceConfig,
} from "../../configs/index.js";
import {
  createRequestLoggerMiddleware,
  createNotFoundMiddleware,
  createInternalServerErrorMiddleware,
  createTimeoutErrorMiddleware,
  createServer,
  createLoggedServer,
} from "@notification-platform/http";
import type { Container } from "../types/index.js";
import { createHealthcheckController } from "../../infrastracture/http/index.js";

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
    healthcheckController: asFunction(({ checkHealthUseCase }) => {
      const healthcheckController = createHealthcheckController(
        { checkHealthUseCase },
        healthcheckControllerConfig,
      );

      return healthcheckController;
    }).singleton(),
    server: asFunction(
      ({
        requestLoggerMiddleware,
        healthcheckController,
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
