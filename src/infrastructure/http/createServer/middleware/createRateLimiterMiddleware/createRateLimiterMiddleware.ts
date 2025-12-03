import { NextFunction, Request, Response, RequestHandler } from "express";
import rateLimit, { Options } from "express-rate-limit";

import { RateLimiterMiddlewareConfig } from "./interfaces/index.js";

export const createRateLimiterMiddleware = (
  config: RateLimiterMiddlewareConfig,
): RequestHandler => {
  const { windowMs, max } = config;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: "HTTP 429 Too Many Requests",
      message: "Превышен лимит запросов. Повторите попытку позже.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
      options: Options,
    ) => {
      res.status(options.statusCode).json(options.message);
      return;
    },
  });
};
