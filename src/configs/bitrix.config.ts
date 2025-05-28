import { BitrixSenderConfig } from "../infrastructure/senders/bitrixSender/interfaces/BitrixSenderConfig";

export const bitrixConfig: BitrixSenderConfig = {
  url: `https://bitrix24.planarchel.ru/rest/${process.env.BITRIX_USER_ID}/${process.env.BITRIX_AUTH_KEY}`,
};
