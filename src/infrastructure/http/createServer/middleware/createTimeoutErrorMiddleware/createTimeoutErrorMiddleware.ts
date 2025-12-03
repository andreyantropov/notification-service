import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { TimeoutError } from "p-timeout";

export const createTimeoutErrorMiddleware = (): ErrorRequestHandler => {
  return (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (error instanceof TimeoutError) {
      res.status(504).json({
        error: "HTTP 504 Gateway Timeout",
        message: error.message || "Превышено время выполнения запроса",
      });
      return;
    }

    next(error);
  };
};
