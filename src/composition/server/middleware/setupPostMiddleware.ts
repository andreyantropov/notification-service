import { Express } from "express";
import { createInternalServerErrorMiddleware } from "../../../infrastructure/http/express/middleware/createInternalServerErrorMiddleware/createInternalServerErrorMiddleware.js";
import { createNotFoundMiddleware } from "../../../infrastructure/http/express/middleware/createNotFoundMiddleware/createNotFoundMiddleware.js";

export const setupPostMiddleware = (app: Express) => {
  const notFoundMiddleware = createNotFoundMiddleware();
  const internalServerErrorMiddleware = createInternalServerErrorMiddleware();

  app.use(notFoundMiddleware);
  app.use(internalServerErrorMiddleware);
};
