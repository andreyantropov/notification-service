import { NextFunction, Request, RequestHandler, Response } from "express";
import z from "zod";

export const createValidateRequestSchemaMiddleware = (
  schema: z.ZodTypeAny,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "HTTP 400 Bad Request",
          message: "Некорректное тело запроса",
          details: error.errors,
        });
        return;
      }
      throw error;
    }
  };
};
