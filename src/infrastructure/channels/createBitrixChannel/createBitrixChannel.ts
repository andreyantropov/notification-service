import axios from "axios";
import pTimeout from "p-timeout";

import { BitrixChannelConfig } from "./interfaces/BitrixChannelConfig.js";
import { Channel } from "../../../domain/ports/Channel.js";
import { Contact, isBitrixContact } from "../../../domain/types/Contact.js";

const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;

export const createBitrixChannel = (config: BitrixChannelConfig): Channel => {
  const { baseUrl, userId, authToken } = config;

  const type = "bitrix";

  const isSupports = (contact: Contact): boolean => {
    return contact.type === type;
  };

  const send = async (contact: Contact, message: string): Promise<void> => {
    if (!isBitrixContact(contact)) {
      throw new Error(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "${contact.type}"`,
      );
    }

    try {
      const restUrl = `${baseUrl}/rest/${userId}/${authToken}`.trim();

      const responce = await axios.post(
        `${restUrl}/im.notify.personal.add.json`,
        null,
        {
          params: {
            user_id: contact.value,
            message,
          },
        },
      );
      const data = responce.data;

      if (!data.result) {
        throw new Error(
          "Bitrix вернул успешный статус, но операция не удалась",
        );
      }
    } catch (error) {
      throw new Error(`Не удалось отправить уведомление через Bitrix`, {
        cause: error,
      });
    }
  };

  const checkHealth = async (): Promise<void> => {
    try {
      await pTimeout(
        axios.get(baseUrl, {
          validateStatus: (status) => status >= 200 && status < 400,
        }),
        {
          milliseconds: DEFAULT_HEALTHCHECK_TIMEOUT,
          message: "Превышено время ожидания ответа от Bitrix",
        },
      );
    } catch (error) {
      throw new Error(`Bitrix недоступен`, { cause: error });
    }
  };

  return {
    type,
    isSupports,
    send,
    checkHealth,
  };
};
