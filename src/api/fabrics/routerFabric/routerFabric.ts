import { createNotificationRouter } from "../../routers/notificationRouter/notificationRouter.js";
import { RouterFabric } from "./interfaces/RouterFabric.js";
import { RouterFabricConfig } from "./interfaces/RouterFabricConfig.js";

export const createDefaultRouter = ({
  path,
  notificationController,
  validateMiddleware,
}: RouterFabricConfig): RouterFabric => {
  const notificationRouter = createNotificationRouter({
    path: path,
    validate: validateMiddleware,
    handler: notificationController.send,
  });

  return {
    notificationRouter,
  };
};
