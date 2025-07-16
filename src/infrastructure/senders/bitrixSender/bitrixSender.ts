import axios from "axios";
import { BitrixSenderConfig } from "./interfaces/BitrixSenderConfig.js";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";
import {
  Recipient,
  isBitrixRecipient,
} from "../../../domain/types/Recipient.js";
import pTimeout from "p-timeout";

const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;

export const createBitrixSender = ({
  url,
}: BitrixSenderConfig): NotificationSender => {
  const isSupports = (recipient: Recipient): boolean => {
    return recipient.type === "bitrix";
  };

  const send = async (recipient: Recipient, message: string): Promise<void> => {
    if (!isBitrixRecipient(recipient)) {
      throw new Error(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "${recipient.type}"`,
      );
    }

    try {
      const responce = await axios.post(
        `${url}/im.notify.personal.add.json`,
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
      const responsePromise = axios.get(`${url}/rest.misc.getshortpathdata`, {
        params: { path: "" },
      });

      const response = await pTimeout(responsePromise, {
        milliseconds: DEFAULT_HEALTHCHECK_TIMEOUT,
        message: "Превышено время ожидания ответа от Bitrix",
      });

      const data = response.data;

      if (!data || !data.result) {
        throw new Error("Ответ не соответствует ожидаемому формату");
      }
    } catch (error) {
      throw new Error(`Bitrix недоступен`, { cause: error });
    }
  };

  return {
    isSupports,
    send,
    checkHealth,
  };
};
