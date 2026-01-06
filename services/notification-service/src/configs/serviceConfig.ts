import z from "zod";

import { EnvironmentType } from "@notification-platform/shared";
import type { ServiceConfig } from "../composition/types/index.js";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "name должен быть не короче 3 символов")
    .max(256, "name не должен превышать 256 символов"),
  version: z
    .string()
    .trim()
    .min(5, "version должен быть не короче 5 символов")
    .max(32, "version не должен превышать 32 символов"),
  environment: z.nativeEnum(EnvironmentType),
  port: z.coerce.number().int().positive().default(3000),
  publicUrl: z
    .string()
    .trim()
    .url(
      "publicUrl должен быть валидным URL (например, http://localhost:3000/api)",
    )
    .default("http://localhost:3000/api"),
  title: z
    .string()
    .trim()
    .min(3, "title должен быть не короче 3 символов")
    .max(256, "title не должен превышать 256 символов"),
  description: z
    .string()
    .trim()
    .min(3, "description должен быть не короче 3 символов")
    .max(256, "description не должен превышать 2048 символов")
    .optional(),
});

const rawEnv = {
  name: process.env.SERVICE_NAME,
  version: process.env.SERVICE_VERSION,
  environment: process.env.SERVICE_ENVIRONMENT,
  port: process.env.SERVICE_PORT,
  publicUrl: process.env.SERVICE_PUBLIC_URL,
  title: process.env.SERVICE_TITLE,
  description: process.env.SERVICE_DESCRIPTION,
};

export const serviceConfig: ServiceConfig = schema.parse(rawEnv);
