import { asFunction, AwilixContainer } from "awilix";
import express from "express";
import swaggerUi from "swagger-ui-express";

import { authConfig, serverConfig } from "../../../configs/index.js";
import {
  createRateLimiterMiddleware,
  createRequestLoggerMiddleware,
  createActiveRequestsCountMiddleware,
  createAuthenticationMiddleware,
  createAuthorizationMiddleware,
  createNotificationController,
  createHealthcheckController,
  createNotFoundMiddleware,
  createInternalServerErrorMiddleware,
  createServer,
} from "../../../infrastructure/http/express/index.js";
import { EventType } from "../../../infrastructure/telemetry/logging/index.js";
import { getSwagger } from "../../../ui/openapi/swagger.js";
import { Container } from "../../types/Container.js";

export const registerHttp = (container: AwilixContainer<Container>) => {
  container.register({
    app: asFunction(
      ({
        logger,
        activeRequestsCounter,
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

        const activeRequestsCounterMiddleware =
          createActiveRequestsCountMiddleware({ activeRequestsCounter });
        app.use(activeRequestsCounterMiddleware);

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
        const healthcheckController = createHealthcheckController({
          checkNotificationServiceHealthUseCase,
        });

        app.post(
          "/api/v1/notifications",
          authenticationMiddleware,
          authorizationMiddleware,
          notificationController.send,
        );
        app.get("/api/health/live", healthcheckController.live);
        app.get("/api/health/ready", healthcheckController.ready);

        const swaggerSpec = getSwagger({ baseUrl: serverConfig.url });
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        app.use(createNotFoundMiddleware());
        app.use(createInternalServerErrorMiddleware());

        return app;
      },
    ).singleton(),

    server: asFunction(({ app, activeRequestsCounter, logger }) =>
      createServer(
        { app, activeRequestsCounter },
        {
          port: serverConfig.port,
          gracefulShutdownTimeout: serverConfig.gracefulShutdownTimeout,
          onStart: () =>
            logger.debug({
              message: `Сервер успешно запущен`,
              eventType: EventType.Bootstrap,
            }),
          onStartWarning: (message: string) =>
            logger.warning({
              message,
              eventType: EventType.Bootstrap,
            }),
          onStartError: (error) =>
            logger.critical({
              message: `Не удалось запустить сервер на порту ${serverConfig.port}`,
              eventType: EventType.Bootstrap,
              error,
            }),
          onRuntimeError: (error) =>
            logger.critical({
              message: `Критическая ошибка в работе сервера`,
              eventType: EventType.Shutdown,
              error,
            }),
          onShutdown: () =>
            logger.debug({
              message: `Сервер успешно остановлен`,
              eventType: EventType.Shutdown,
            }),
          onShutdownWarning: (message: string) =>
            logger.warning({
              message,
              eventType: EventType.Shutdown,
            }),
          onShutdownError: (error) =>
            logger.critical({
              message: `Не удалось корректно завершить работу сервера`,
              eventType: EventType.Shutdown,
              error,
            }),
        },
      ),
    ).singleton(),
  });
};
