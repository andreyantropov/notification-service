import express, { Express } from "express";
import { createRateLimiter } from "../../api/middleware/rateLimitMiddleware/rateLimitMiddleware.js";
import { createRequestLoggerMiddleware } from "../../api/middleware/requestLoggerMiddleware/requestLoggerMiddleware.js";
import { serverConfig } from "../../configs/index.js";
import { createDefaultNotificationLoggerService } from "../core/notificationLoggerService.js";
import { getDefaultActiveRequestCounter } from "./activeRequestsCounter.js";
import { createActiveRequestsCounterMiddleware } from "../../api/middleware/activeRequestsCounterMiddleware.ts/activeRequestsCounterMiddleware.js";

export const setupPreMiddleware = (app: Express) => {
  const { rateLimitTime, rateLimitTries } = serverConfig;

  const activeRequestsCounter = getDefaultActiveRequestCounter();
  const notificationLoggerService = createDefaultNotificationLoggerService();

  const jsonParser = express.json();
  const rateLimitMiddleware = createRateLimiter({
    time: rateLimitTime,
    tries: rateLimitTries,
  });
  const activeRequestsCounterMiddleware = createActiveRequestsCounterMiddleware(
    activeRequestsCounter,
  );
  const loggerMiddleware = createRequestLoggerMiddleware({
    notificationLoggerService,
  });

  app.use(jsonParser);
  app.use(activeRequestsCounterMiddleware);
  app.use(loggerMiddleware);
  app.use(rateLimitMiddleware);
};
