import { Express } from "express";
import {
  createInternalServerErrorMiddleware,
  createNotFoundMiddleware,
} from "../../../infrastructure/http/express/middleware/index.js";

export const setupPostMiddleware = (app: Express) => {
  const notFoundMiddleware = createNotFoundMiddleware();
  const internalServerErrorMiddleware = createInternalServerErrorMiddleware();

  app.use(notFoundMiddleware);
  app.use(internalServerErrorMiddleware);
};
