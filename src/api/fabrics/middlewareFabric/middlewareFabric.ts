import express from "express";
import { createInternalServerErrorMiddleware } from "../../middleware/internalServerErrorMiddleware/internalServerErrorMiddleware.js";
import { createNotFoundMiddleware } from "../../middleware/notFoundMiddleware/notFoundMiddleware.js";
import { createRateLimiter } from "../../middleware/rateLimitMiddleware/rateLimitMiddleware.js";
import { createRequestLoggerMiddleware } from "../../middleware/requestLoggerMiddleware/index.js";
import { MiddlewareFabricConfig } from "./interfaces/MiddlewareFabricConfig.js";
import { MiddlewareFabric } from "./interfaces/MiddlewareFabric.js";

export const createDefaultMiddlewares = ({
  rateLimitConfig,
  notificationLoggerService,
}: MiddlewareFabricConfig): MiddlewareFabric => {
  const jsonParser = express.json();
  const rateLimitMiddleware = createRateLimiter(rateLimitConfig);
  const loggerMiddleware = createRequestLoggerMiddleware({
    notificationLoggerService,
  });
  const notFoundMiddleware = createNotFoundMiddleware();
  const internalServerErrorMiddleware = createInternalServerErrorMiddleware();

  return {
    jsonParser,
    rateLimitMiddleware,
    loggerMiddleware,
    notFoundMiddleware,
    internalServerErrorMiddleware,
  };
};
