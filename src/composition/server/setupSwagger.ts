import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { getSwaggerSpec } from "../../api/docs/swagger.spec.js";
import { serverConfig } from "../../configs/server.config.js";

export const setupSwagger = (app: Express) => {
  const { url } = serverConfig;

  const swaggerSpec = getSwaggerSpec({ baseUrl: url });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
