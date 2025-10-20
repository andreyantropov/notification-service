import { RequestHandler, Request, Response, NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";

import { AuthenticationMiddlewareConfig } from "./interfaces/AuthenticationMiddlewareConfig.js";

const DEFAULT_TOKEN_SIGNING_ALG = "RS256";

export const createAuthenticationMiddleware = (
  config: AuthenticationMiddlewareConfig,
): RequestHandler => {
  const {
    issuer,
    jwksUri,
    audience,
    tokenSigningAlg = DEFAULT_TOKEN_SIGNING_ALG,
  } = config;

  if (!issuer || !jwksUri || !audience) {
    throw new Error("Не заполнены обязательные поля конфигурации");
  }

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
