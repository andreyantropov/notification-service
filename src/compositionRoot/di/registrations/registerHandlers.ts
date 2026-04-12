import { asFunction, type AwilixContainer } from "awilix";
import express from "express";

import {
  createAuthenticationMiddleware,
  createAuthorizationMiddleware,
  createHealthController,
  createInternalServerErrorMiddleware,
  createLoggerMiddleware,
  createMeterMiddleware,
  createMockAuthenticationMiddleware,
  createMockAuthorizationMiddleware,
  createNotFoundMiddleware,
  createNotificationController,
  createRouter,
  createTimeoutErrorMiddleware,
} from "../../../infrastructure/http/index.js";
import { createSwaggerSpecification } from "../../../presentation/createSwaggerSpecification/index.js";
import { type Container } from "../interfaces/Container.js";

export const registerHandlers = (container: AwilixContainer<Container>) => {
  container.register({
    preHandlers: asFunction(({ logger, meter }) => {
      const loggerMiddleware = createLoggerMiddleware({ logger });
      const meterMiddleware = createMeterMiddleware({ meter });

      return [express.json(), loggerMiddleware, meterMiddleware];
    }).singleton(),

    postHandlers: asFunction(() => {
      const notFoundMiddleware = createNotFoundMiddleware();
      const timeoutErrorMiddleware = createTimeoutErrorMiddleware();
      const internalServerErrorMiddleware =
        createInternalServerErrorMiddleware();

      return [
        notFoundMiddleware,
        timeoutErrorMiddleware,
        internalServerErrorMiddleware,
      ];
    }).singleton(),

    router: asFunction(
      ({
        env,
        receiveNotificationUseCase,
        receiveNotificationBatchUseCase,
        checkLivenessUseCase,
        checkReadinessUseCase,
      }) => {
        const authenticationMiddleware =
          env.NODE_ENV === "production"
            ? createAuthenticationMiddleware({
                issuer: env.AUTHENTICATION_MIDDLEWARE_ISSUER,
                jwksUri: env.AUTHENTICATION_MIDDLEWARE_JWKS_URI,
                audience: env.AUTHENTICATION_MIDDLEWARE_AUDIENCE,
                tokenSigningAlg:
                  env.AUTHENTICATION_MIDDLEWARE_TOKEN_SIGNING_ALG,
              })
            : createMockAuthenticationMiddleware();

        const authorizationMiddleware =
          env.NODE_ENV === "production"
            ? createAuthorizationMiddleware({
                serviceClientId: env.AUTHORIZATION_MIDDLEWARE_SERVICE_CLIENT_ID,
                requiredRoles: env.AUTHORIZATION_MIDDLEWARE_REQUIRED_ROLES,
              })
            : createMockAuthorizationMiddleware();

        const notificationController = createNotificationController({
          receiveNotificationUseCase,
          receiveNotificationBatchUseCase,
        });

        const healthController = createHealthController({
          checkLivenessUseCase,
          checkReadinessUseCase,
        });

        const swaggerSpecification = createSwaggerSpecification({
          title: env.SERVICE_TITLE,
          url: env.SERVICE_URL,
        });

        const appRouter = createRouter({
          middlewares: {
            authenticationMiddleware,
            authorizationMiddleware,
          },
          controllers: {
            notificationController,
            healthController,
            swaggerSpecification,
          },
        });

        return appRouter;
      },
    ).singleton(),
  });
};
