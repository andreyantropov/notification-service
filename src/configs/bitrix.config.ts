import { z } from "zod";
import { BitrixSenderConfig } from "../infrastructure/senders/createBitrixSender/interfaces/BitrixSenderConfig.js";

const bitrixConfigSchema = z.object({
  url: z.string().url("Некорректный URL Bitrix").includes("rest/", {
    message: "URL Bitrix должен содержать 'rest/'",
  }),
});

export const bitrixConfig: BitrixSenderConfig = bitrixConfigSchema.parse({
  url: `https://bitrix24.planarchel.ru/rest/${process.env.BITRIX_USER_ID}/${process.env.BITRIX_AUTH_KEY}`,
});
