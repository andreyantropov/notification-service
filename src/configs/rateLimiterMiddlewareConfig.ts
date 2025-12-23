import z from "zod";

import type { RateLimiterMiddlewareConfig } from "../infrastructure/http/index.js";

const schema = z.object({
  windowMs: z.coerce.number().int().positive().default(60_000),
  max: z.coerce.number().int().positive().default(100),
});

const rawEnv = {
  windowMs: process.env.RATE_LIMITER_MIDDLEWARE_WINDOW_MS,
  max: process.env.RATE_LIMITER_MIDDLEWARE_MAX,
};

export const rateLimiterMiddlewareConfig: RateLimiterMiddlewareConfig =
  schema.parse(rawEnv);
