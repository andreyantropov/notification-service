import z from "zod";
import { ServerConfig } from "../api/fabrics/appFabric/interfaces/ServerConfig.js";

const serverConfigSchema = z.object({
  url: z.string().url("Некорректный URL сервера").min(1),
  port: z.coerce.number().int().positive().default(3000),
  rateLimitTime: z.coerce.number().int().positive().default(60_000),
  rateLimitTries: z.coerce.number().int().positive().default(100),
});

export const serverConfig: ServerConfig = serverConfigSchema.parse({
  url: process.env.URL,
  port: process.env.PORT,
  rateLimitTime: process.env.RATE_LIMIT_PERIOD,
  rateLimitTries: process.env.RATE_LIMIT_TRIES,
});
