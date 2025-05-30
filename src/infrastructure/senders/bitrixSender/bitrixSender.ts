import axios from "axios";
import { BitrixSenderConfig } from "./interfaces/BitrixSenderConfig";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender";
import { Recipient, isBitrixRecipient } from "../../../domain/types/Recipient";

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

  return {
    isSupports,
    send,
  };
};
