import { z } from "zod";

import { EmailChannelConfig } from "../infrastructure/channels/index.js";

const emailChannelConfigSchema = z.object({
  host: z
    .string()
    .trim()
    .min(3, "host должен быть не короче 3 символов")
    .max(256, "host не должен превышать 256 символов"),
  port: z.coerce.number().int().positive().default(25),
  secure: z.coerce.boolean().default(false),
  auth: z.object({
    user: z
      .string()
      .trim()
      .min(3, "user должен быть не короче 3 символов")
      .max(64, "user не должен превышать 64 символов"),
    pass: z
      .string()
      .trim()
      .min(8, "pass должен быть не короче 8 символов")
      .max(256, "pass не должен превышать 256 символов"),
  }),
  fromEmail: z
    .string()
    .trim()
    .min(8, "fromEmail должен быть не короче 8 символов")
    .max(256, "fromEmail не должен превышать 256 символов"),
  greetingTimeoutMs: z.coerce.number().int().positive().optional(),
  sendTimeoutMs: z.coerce.number().int().positive().optional(),
  healthcheckTimeoutMs: z.coerce.number().int().positive().optional(),
});

export const emailChannelConfig: EmailChannelConfig =
  emailChannelConfigSchema.parse({
    host: process.env.EMAIL_CHANNEL_HOST,
    port: process.env.EMAIL_CHANNEL_PORT,
    secure: process.env.EMAIL_CHANNEL_SECURE,
    auth: {
      user: process.env.EMAIL_CHANNEL_LOGIN,
      pass: process.env.EMAIL_CHANNEL_PASSWORD,
    },
    fromEmail: process.env.EMAIL_CHANNEL_FROM_EMAIL,
    greetingTimeoutMs: process.env.EMAIL_CHANNEL_GREETING_TIMEOUT_MS,
    sendTimeoutMs: process.env.EMAIL_CHANNEL_SEND_TIMEOUT_MS,
    healthcheckTimeoutMs: process.env.EMAIL_CHANNEL_HEALTHCHECK_TIMEOUT_MS,
  });
