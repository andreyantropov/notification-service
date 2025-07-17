import { Express } from "express";
import { createInternalServerErrorMiddleware } from "../../api/middleware/internalServerErrorMiddleware/internalServerErrorMiddleware.js";
import { createNotFoundMiddleware } from "../../api/middleware/notFoundMiddleware/notFoundMiddleware.js";

export const setupPostMiddleware = (app: Express) => {
  const notFoundMiddleware = createNotFoundMiddleware();
  const internalServerErrorMiddleware = createInternalServerErrorMiddleware();

  app.use(notFoundMiddleware);
  app.use(internalServerErrorMiddleware);
};
