import z from "zod";

const serverConfigSchema = z.object({
  url: z
    .string()
    .url(
      "Некорректный URL сервера: должен быть валидным URL (например, http://localhost)",
    )
    .default("http://localhost"),
  port: z.coerce.number().int().positive().default(3000),
  rateLimitTime: z.coerce.number().int().positive().default(60_000),
  rateLimitTries: z.coerce.number().int().positive().default(100),
  gracefulShutdownTimeout: z.coerce.number().int().positive().default(30_000),
});

export const serverConfig = serverConfigSchema.parse({
  url: process.env.URL,
  port: process.env.PORT,
  rateLimitTime: process.env.RATE_LIMIT_PERIOD,
  rateLimitTries: process.env.RATE_LIMIT_TRIES,
  gracefulShutdownTimeout: process.env.GRACEFUL_SHUTDOWN_TIMEOUT,
});
