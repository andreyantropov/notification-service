import { z } from "zod";

import type { HealthcheckControllerConfig } from "../infrastructure/http/index.js";

const schema = z.object({
  readyTimeoutMs: z.coerce.number().int().positive().optional(),
});

const rawEnv = {
  readyTimeoutMs: process.env.HEALTHCHECK_CONTROLLER_READY_TIMEOUT_MS,
};

export const healthcheckControllerConfig: HealthcheckControllerConfig =
  schema.parse(rawEnv);
