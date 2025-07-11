import { getSwaggerSpec } from "../../docs/swagger.spec.js";
import { SwaggerFabric } from "./interfaces/SwaggerFabric.js";
import { SwaggerFabricConfig } from "./interfaces/SwaggerFabricConfig.js";

export const createDefaultSwagger = ({
  baseUrl,
}: SwaggerFabricConfig): SwaggerFabric => {
  const swaggerSpec = getSwaggerSpec({ baseUrl });
  return {
    swaggerSpec,
  };
};
