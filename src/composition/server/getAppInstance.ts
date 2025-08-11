import express from "express";
import { setupPreMiddleware } from "./middleware/setupPreMiddleware.js";
import { setupPostMiddleware } from "./middleware/setupPostMiddleware.js";
import { setupRouter } from "./routes/setupRouter.js";
import { setupSwagger } from "./swagger/setupSwagger.js";

let instance: express.Express | null = null;

export const getAppInstance = (): express.Express => {
  if (instance === null) {
    const app = express();
    setupPreMiddleware(app);
    setupRouter(app);
    setupSwagger(app);
    setupPostMiddleware(app);
    instance = app;
  }

  return instance;
};
