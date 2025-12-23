import { z } from "zod";

import type { BitrixChannelConfig } from "../infrastructure/channels/index.js";

const schema = z.object({
  baseUrl: z
    .string()
    .trim()
    .url("baseUrl должен быть валидным URL (например, https://bitrix24.ru)"),
  userId: z
    .string()
    .trim()
    .min(1, "userId не может быть пустым")
    .regex(/^\d+$/, "userId должен быть положительным целым числом"),
  authToken: z
    .string()
    .trim()
    .min(16, "authToken должен быть не короче 16 символов")
    .max(512, "authToken не должен превышать 512 символов"),
  sendTimeoutMs: z.coerce.number().int().positive().optional(),
  healthcheckTimeoutMs: z.coerce.number().int().positive().optional(),
});

const rawEnv = {
  baseUrl: process.env.BITRIX_CHANNEL_BASE_URL,
  userId: process.env.BITRIX_CHANNEL_USER_ID,
  authToken: process.env.BITRIX_CHANNEL_AUTH_TOKEN,
  sendTimeoutMs: process.env.BITRIX_CHANNEL_SEND_TIMEOUT_MS,
  healthcheckTimeoutMs: process.env.BITRIX_CHANNEL_HEALTHCHECK_TIMEOUT_MS,
};

const isEnabled = process.env.BITRIX_CHANNEL_IS_ENABLED !== "false";

export const bitrixChannelConfig: BitrixChannelConfig | null = isEnabled
  ? schema.parse(rawEnv)
  : null;
