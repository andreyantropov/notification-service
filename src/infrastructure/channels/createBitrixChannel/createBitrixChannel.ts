import axios from "axios";

import { type Channel } from "../../../domain/ports/index.js";
import {
  CHANNEL_TYPE,
  type Contact,
  isContactOfType,
} from "../../../domain/types/index.js";

import { type BitrixChannelConfig } from "./interfaces/index.js";

export const createBitrixChannel = (config: BitrixChannelConfig): Channel => {
  const { baseUrl, userId, authToken, timeoutMs } = config;

  const type = CHANNEL_TYPE.BITRIX;

  const isSupports = (
    contact: Contact,
  ): contact is Extract<Contact, { type: typeof CHANNEL_TYPE.BITRIX }> => {
    return isContactOfType(contact, type);
  };

  const send = async (contact: Contact, message: string): Promise<void> => {
    if (!isSupports(contact)) {
      throw new Error(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "${contact.type}"`,
      );
    }

    try {
      const response = await axios.post(
        `${baseUrl}/rest/${userId}/${authToken}/im.notify.personal.add.json`,
        {
          user_id: contact.value,
          message,
        },
        { timeout: timeoutMs },
      );

      const data = response.data;

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
      await axios.get(
        `${baseUrl}/rest/${userId}/${authToken}/server.time.json`,
        { timeout: timeoutMs },
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
