import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { serverConfig } from "../../../configs/index.js";
import { getSwaggerSpec } from "../../../api/openapi/index.js";

export const setupSwagger = (app: Express) => {
  const { url } = serverConfig;

  const swaggerSpec = getSwaggerSpec({ baseUrl: url });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
