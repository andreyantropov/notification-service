import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import { type AuthorizationMiddlewareConfig } from "./interfaces/index.js";

export const createAuthorizationMiddleware = (
  config: AuthorizationMiddlewareConfig,
): RequestHandler => {
  const { requiredRoles } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new Error(`Запрос не был авторизован`));
    }

    const { roles } = req.user;
    const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({
        message: "Недостаточно прав для выполнения операции",
      });
      return;
    }

    next();
  };
};
