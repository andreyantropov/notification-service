import z from "zod";

export interface ValidateRequestSchemaMiddlewareConfig {
  schema: z.ZodTypeAny;
}
