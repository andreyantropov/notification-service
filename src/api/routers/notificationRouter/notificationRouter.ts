import express, { Router } from "express";
import { NotificationRouterConfig } from "./interfaces/NotificationRouterConfig.js";

export const createNotificationRouter = ({
  path,
  validate,
  handler,
}: NotificationRouterConfig): Router => {
  const router = express.Router();

  router.post(path, validate, handler);

  return router;
};
