/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from "express";

export const createInternalServerErrorMiddleware = (): ErrorRequestHandler => {
  return (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    res.status(500).json({
      message: "Внутренняя ошибка сервера",
    });
    return;
  };
};
