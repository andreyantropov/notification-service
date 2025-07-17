import express from "express";
import { setupPreMiddleware } from "./setupPreMiddleware.js";
import { setupRouter } from "./setupRouter.js";
import { setupSwagger } from "./setupSwagger.js";
import { setupPostMiddleware } from "./setupPostMiddleware.js";

export const createDefaultApp = () => {
  const app = express();
  setupPreMiddleware(app);
  setupRouter(app);
  setupSwagger(app);
  setupPostMiddleware(app);

  return app;
};
