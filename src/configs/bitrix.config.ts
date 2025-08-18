import { z } from "zod";
import { BitrixSenderConfig } from "../infrastructure/senders/createBitrixSender/interfaces/BitrixSenderConfig.js";

const bitrixConfigSchema = z.object({
  baseUrl: z
    .string()
    .url(
      "Некорректный URL Bitrix: baseUrl должен быть валидным URL (например, https://bitrix24.planarchel.ru)",
    ),
  userId: z.string().min(1, "userId не может быть пустым"),
  authToken: z.string().min(1, "authToken не может быть пустым"),
});

export const bitrixConfig: BitrixSenderConfig = bitrixConfigSchema.parse({
  baseUrl: process.env.BITRIX_BASE_URL,
  userId: process.env.BITRIX_USER_ID,
  authToken: process.env.BITRIX_AUTH_KEY,
});
