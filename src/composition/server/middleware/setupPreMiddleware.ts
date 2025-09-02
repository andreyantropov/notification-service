import express, { Express } from "express";
import { serverConfig } from "../../../configs/index.js";
import {
  createRateLimiter,
  createActiveRequestsCounterMiddleware,
  createRequestLoggerMiddleware,
} from "../../../infrastructure/http/express/middleware/index.js";
import { getLoggerAdapterInstance } from "../../core/services/getLoggerAdapterInstance.js";
import { getActiveRequestCounterInstance } from "../../infrastracture/getActiveRequestCounterInstance.js";

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
