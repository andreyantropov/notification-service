import { NextFunction, Request, Response, RequestHandler } from "express";
import rateLimit, { Options } from "express-rate-limit";

export const createRateLimiter = (
  time: number,
  tries: number,
): RequestHandler => {
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
