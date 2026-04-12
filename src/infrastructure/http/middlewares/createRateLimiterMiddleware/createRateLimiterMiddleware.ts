import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import rateLimit, { type Options } from "express-rate-limit";

import { type RateLimiterMiddlewareConfig } from "./interfaces/index.js";

export const createRateLimiterMiddleware = (
  config: RateLimiterMiddlewareConfig,
): RequestHandler => {
  const { windowMs, max } = config;

  return rateLimit({
    windowMs,
    max,
    message: "Превышен лимит запросов, попробуйте повторить запрос позже",
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
