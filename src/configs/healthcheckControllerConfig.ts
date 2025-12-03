import { z } from "zod";

import { HealthcheckControllerConfig } from "../infrastructure/http/index.js";

const healthcheckControllerConfigSchema = z.object({
  readyTimeoutMs: z.coerce.number().int().positive().optional(),
});

export const healthcheckControllerConfig: HealthcheckControllerConfig =
  healthcheckControllerConfigSchema.parse({
    readyTimeoutMs: process.env.HEALTHCHECK_CONTROLLER_READY_TIMEOUT_MS,
  });
