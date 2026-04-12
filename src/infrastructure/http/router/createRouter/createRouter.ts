import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import swaggerUi from "swagger-ui-express";

import { type RouterDependencies } from "./interfaces/index.js";

export const createRouter = (dependencies: RouterDependencies): Router => {
  const {
    middlewares: { authenticationMiddleware, authorizationMiddleware },
    controllers: {
      notificationController,
      healthController,
      swaggerSpecification,
    },
  } = dependencies;

  const notificationRouter = Router();
  notificationRouter.post(
    "/",
    expressAsyncHandler(notificationController.send),
  );
  notificationRouter.post(
    "/batch",
    expressAsyncHandler(notificationController.sendBatch),
  );

  const healthRouter = Router();
  healthRouter.get("/live", expressAsyncHandler(healthController.live));
  healthRouter.get("/ready", expressAsyncHandler(healthController.ready));

  const docsRouter = Router();
  docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpecification));

  const apiRouter = Router();
  apiRouter.use(
    "/v1/notifications",
    authenticationMiddleware,
    authorizationMiddleware,
    notificationRouter,
  );

  const rootRouter = Router();
  rootRouter.use("/api", apiRouter);
  rootRouter.use("/api-docs", docsRouter);
  rootRouter.use("/health", healthRouter);

  return rootRouter;
};
