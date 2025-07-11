import { Request, Response, RequestHandler } from "express";

export const createNotFoundMiddleware = (): RequestHandler => {
  return (req: Request, res: Response): void => {
    res.status(404).json({
      error: "HTTP 404 Not Found",
      message: "Запрошенный ресурс не найден",
    });
  };
};
