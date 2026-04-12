import {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from "express";
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
        message: "Превышено время выполнения запроса",
      });
      return;
    }

    next(error);
  };
};
