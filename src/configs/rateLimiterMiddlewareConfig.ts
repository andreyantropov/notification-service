import z from "zod";

import { RateLimiterMiddlewareConfig } from "../infrastructure/http/index.js";

const rateLimiterMiddlewareConfigSchema = z.object({
  windowMs: z.coerce.number().int().positive().default(60_000),
  max: z.coerce.number().int().positive().default(100),
});

export const rateLimiterMiddlewareConfig: RateLimiterMiddlewareConfig =
  rateLimiterMiddlewareConfigSchema.parse({
    windowMs: process.env.RATE_LIMITER_MIDDLEWARE_WINDOW_MS,
    max: process.env.RATE_LIMITER_MIDDLEWARE_MAX,
  });
