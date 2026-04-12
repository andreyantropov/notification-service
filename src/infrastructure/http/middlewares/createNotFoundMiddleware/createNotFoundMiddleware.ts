import { type Request, type RequestHandler, type Response } from "express";

export const createNotFoundMiddleware = (): RequestHandler => {
  return (req: Request, res: Response): void => {
    res.status(404).json({
      message: "Запрошенный ресурс не найден",
    });
    return;
  };
};
