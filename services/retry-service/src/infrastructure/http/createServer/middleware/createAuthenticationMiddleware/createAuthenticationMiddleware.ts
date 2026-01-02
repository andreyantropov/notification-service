import type { RequestHandler, Request, Response, NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";

import type { AuthenticationMiddlewareConfig } from "./interfaces/index.js";

export const createAuthenticationMiddleware = (
  config: AuthenticationMiddlewareConfig,
): RequestHandler => {
  const { issuer, jwksUri, audience, tokenSigningAlg } = config;

  const jwtAuth = auth({
    issuerBaseURL: issuer,
    jwksUri,
    audience,
    tokenSigningAlg,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    jwtAuth(req, res, (error: unknown) => {
      if (error) {
        res.status(401).json({
          error: "HTTP 401 Unauthorized",
          message: "Запрос не был авторизован",
        });
        return;
      }

      next();
    });
  };
};
