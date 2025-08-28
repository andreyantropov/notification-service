import express, { Express } from "express";
import { serverConfig } from "../../../configs/index.js";
import { getActiveRequestCounterInstance } from "../counters/getActiveRequestCounterInstance.js";
import { getLoggerAdapterInstance } from "../../core/services/getLoggerAdapterInstance.js";
import { createActiveRequestsCounterMiddleware } from "../../../infrastructure/http/express/middleware/createActiveRequestsCounterMiddleware.ts/index.js";
import { createRateLimiter } from "../../../infrastructure/http/express/middleware/createRateLimitMiddleware/createRateLimitMiddleware.js";
import { createRequestLoggerMiddleware } from "../../../infrastructure/http/express/middleware/createRequestLoggerMiddleware/createRequestLoggerMiddleware.js";

export const setupPreMiddleware = (app: Express) => {
  const { rateLimitTime, rateLimitTries } = serverConfig;

  const activeRequestsCounter = getActiveRequestCounterInstance();
  const loggerAdapter = getLoggerAdapterInstance();

  const jsonParser = express.json();
  const rateLimitMiddleware = createRateLimiter(rateLimitTime, rateLimitTries);
  const activeRequestsCounterMiddleware = createActiveRequestsCounterMiddleware(
    activeRequestsCounter,
  );
  const loggerMiddleware = createRequestLoggerMiddleware(loggerAdapter);

  app.use(jsonParser);
  app.use(activeRequestsCounterMiddleware);
  app.use(loggerMiddleware);
  app.use(rateLimitMiddleware);
};
