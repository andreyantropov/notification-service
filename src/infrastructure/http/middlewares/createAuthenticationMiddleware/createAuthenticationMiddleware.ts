import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { auth } from "express-oauth2-jwt-bearer";

import { type AuthenticationMiddlewareConfig } from "./interfaces/index.js";
import { parseUserContext } from "./utils/parseUserContext.js";

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
          message: "Запрос не был авторизован",
        });
        return;
      }

      try {
        req.user = parseUserContext(req.auth?.payload);
      } catch {
        res.status(401).json({
          message: "Некорректная структура токена авторизации",
        });
        return;
      }

      next();
    });
  };
};
