import type { NextFunction, Request, Response, RequestHandler } from "express";

import type { AuthorizationMiddlewareConfig } from "./interfaces/index.js";

export const createAuthorizationMiddleware = (
  config: AuthorizationMiddlewareConfig,
): RequestHandler => {
  const { serviceClientId, requiredRoles } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      return next(new Error(`Запрос не был авторизован`));
    }

    const resourceAccess = req.auth.payload.resource_access as
      | { [key: string]: { roles?: string[] } }
      | undefined;

    const roles = resourceAccess?.[serviceClientId]?.roles || [];
    const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({
        error: "HTTP 403 Forbidden",
        message: "Недостаточно прав для выполнения операции",
      });
      return;
    }

    next();
  };
};
