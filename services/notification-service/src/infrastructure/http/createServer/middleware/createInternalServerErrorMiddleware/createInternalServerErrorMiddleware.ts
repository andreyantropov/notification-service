/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";

export const createInternalServerErrorMiddleware = (): ErrorRequestHandler => {
  return (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    res.status(500).json({
      error: "HTTP 500 Internal Server Error",
      message: error.message || "Unknown error",
    });
    return;
  };
};
