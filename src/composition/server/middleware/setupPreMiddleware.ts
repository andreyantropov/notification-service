import express, { Express } from "express";
import { serverConfig } from "../../../configs/index.js";
import { getActiveRequestCounterInstance } from "./getActiveRequestCounterInstance.js";
import { getNotificationLoggerServiceInstance } from "../../core/services/getNotificationLoggerServiceInstance.js";
import { createActiveRequestsCounterMiddleware } from "../../../infrastructure/http/express/middleware/createActiveRequestsCounterMiddleware.ts/index.js";
import { createRateLimiter } from "../../../infrastructure/http/express/middleware/createRateLimitMiddleware/createRateLimitMiddleware.js";
import { createRequestLoggerMiddleware } from "../../../infrastructure/http/express/middleware/createRequestLoggerMiddleware/createRequestLoggerMiddleware.js";

export const setupPreMiddleware = (app: Express) => {
  const { rateLimitTime, rateLimitTries } = serverConfig;

  const activeRequestsCounter = getActiveRequestCounterInstance();
  const notificationLoggerService = getNotificationLoggerServiceInstance();

  const jsonParser = express.json();
  const rateLimitMiddleware = createRateLimiter(rateLimitTime, rateLimitTries);
  const activeRequestsCounterMiddleware = createActiveRequestsCounterMiddleware(
    activeRequestsCounter,
  );
  const loggerMiddleware = createRequestLoggerMiddleware(
    notificationLoggerService,
  );

  app.use(jsonParser);
  app.use(activeRequestsCounterMiddleware);
  app.use(loggerMiddleware);
  app.use(rateLimitMiddleware);
};
