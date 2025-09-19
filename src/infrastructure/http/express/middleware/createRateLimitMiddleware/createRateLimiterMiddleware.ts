import { NextFunction, Request, Response, RequestHandler } from "express";
import rateLimit, { Options } from "express-rate-limit";

import { RateLimiterMiddlewareConfig } from "./interfaces/RateLimiterMiddlewareConfig.js";

export const createRateLimiterMiddleware = (
  config: RateLimiterMiddlewareConfig,
): RequestHandler => {
  const { time, tries } = config;

  return rateLimit({
    windowMs: time,
    max: tries,
    message: {
      error: "HTTP 429 Too Many Requests",
      message: "Превышен лимит запросов, попробуйте через минуту",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
      options: Options,
    ) => {
      return res.status(options.statusCode).json(options.message);
    },
  });
};
