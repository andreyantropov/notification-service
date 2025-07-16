import { getSwaggerSpec } from "../../docs/swagger.spec.js";
import { Swagger } from "./interfaces/Swagger.js";
import { SwaggerFabricConfig } from "./interfaces/SwaggerFabricConfig.js";

export const createDefaultSwagger = ({
  baseUrl,
}: SwaggerFabricConfig): Swagger => {
  const swaggerSpec = getSwaggerSpec({ baseUrl });
  return {
    swaggerSpec,
  };
};
