import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

export const createMockAuthorizationMiddleware = (): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    next();
  };
};
