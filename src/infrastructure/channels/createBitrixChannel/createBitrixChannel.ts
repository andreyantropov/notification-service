import axios from "axios";
import pTimeout from "p-timeout";

import { BitrixChannelConfig } from "./interfaces/index.js";
import { Channel } from "../../../domain/ports/index.js";
import {
  Contact,
  isContactOfType,
  CHANNEL_TYPES,
} from "../../../domain/types/index.js";

const DEFAULT_SEND_TIMEOUT_MS = 10_000;
const DEFAULT_HEALTHCHECK_TIMEOUT_MS = 5_000;

export const createBitrixChannel = (config: BitrixChannelConfig): Channel => {
  const {
    baseUrl,
    userId,
    authToken,
    sendTimeoutMs = DEFAULT_SEND_TIMEOUT_MS,
    healthcheckTimeoutMs = DEFAULT_HEALTHCHECK_TIMEOUT_MS,
  } = config;

  const type = CHANNEL_TYPES.BITRIX;

  const isSupports = (contact: Contact): boolean => {
    return isContactOfType(contact, type);
  };

  const send = async (contact: Contact, message: string): Promise<void> => {
    if (!isContactOfType(contact, type)) {
      throw new Error(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "${contact.type}"`,
      );
    }

    try {
      const restUrl = `${baseUrl}/rest/${userId}/${authToken}`.trim();

      const response = await pTimeout(
        axios.post(`${restUrl}/im.notify.personal.add.json`, null, {
          params: {
            user_id: contact.value,
            message,
          },
          timeout: sendTimeoutMs,
        }),
        {
          milliseconds: sendTimeoutMs,
          message: `Превышено время ожидания ответа от Bitrix при отправке уведомления`,
        },
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
      await pTimeout(
        axios.get(baseUrl, {
          validateStatus: (status) => status >= 200 && status < 400,
        }),
        {
          milliseconds: healthcheckTimeoutMs,
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
