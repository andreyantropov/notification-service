import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import { DEFAULT_MOCK_USER_CONTEXT } from "./constants/index.js";

export const createMockAuthenticationMiddleware = (): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.user = DEFAULT_MOCK_USER_CONTEXT;
    next();
  };
};
