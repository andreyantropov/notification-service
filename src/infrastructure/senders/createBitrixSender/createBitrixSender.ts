import axios from "axios";
import pTimeout from "p-timeout";

import { BitrixSenderConfig } from "./interfaces/BitrixSenderConfig.js";
import { Sender } from "../../../domain/ports/Sender.js";
import {
  Recipient,
  isBitrixRecipient,
} from "../../../domain/types/Recipient.js";

const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;

export const createBitrixSender = (config: BitrixSenderConfig): Sender => {
  const { baseUrl, userId, authToken } = config;

  const type = "bitrix";

  const isSupports = (recipient: Recipient): boolean => {
    return recipient.type === type;
  };

  const send = async (recipient: Recipient, message: string): Promise<void> => {
    if (!isBitrixRecipient(recipient)) {
      throw new Error(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "${recipient.type}"`,
      );
    }

    try {
      const restUrl = `${baseUrl}/rest/${userId}/${authToken}`.trim();

      const responce = await axios.post(
        `${restUrl}/im.notify.personal.add.json`,
        null,
        {
          params: {
            user_id: recipient.value,
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
