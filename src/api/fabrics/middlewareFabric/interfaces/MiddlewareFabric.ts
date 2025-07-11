import { RequestHandler } from "express";
import { InternalServerErrorMiddleware } from "../../../middleware/internalServerErrorMiddleware/index.js";
import { NotFoundMiddleware } from "../../../middleware/notFoundMiddleware/index.js";
import { RateLimitMiddleware } from "../../../middleware/rateLimitMiddleware/index.js";
import { RequestLoggerMiddleware } from "../../../middleware/requestLoggerMiddleware/index.js";

export interface MiddlewareFabric {
  jsonParser: RequestHandler;
  rateLimitMiddleware: RateLimitMiddleware;
  loggerMiddleware: RequestLoggerMiddleware;
  notFoundMiddleware: NotFoundMiddleware;
  internalServerErrorMiddleware: InternalServerErrorMiddleware;
}
