import { Recipient } from "../../../domain/types/Recipient.js";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";
import { FallbackSenderConfig } from "./interfaces/FallbackSenderConfig.js";

export const createFallbackSender = ({
  senders,
  onError = () => {},
}: FallbackSenderConfig): NotificationSender => {
  if (!senders || senders.length === 0) {
    throw new Error("Не передано ни одного сендера");
  }

  const isSupports = (recipient: Recipient): boolean => {
    return senders.some((sender) => sender.isSupports(recipient));
  };

  const send = async (recipient: Recipient, message: string): Promise<void> => {
    for (const sender of senders) {
      if (!sender.isSupports(recipient)) continue;

      try {
        await sender.send(recipient, message);
        return;
      } catch (error) {
        onError(
          { recipient, message },
          new Error(
            `Ошибка отправки уведомления через канал ${sender.constructor.name}`,
            { cause: error },
          ),
        );
      }
    }

    throw new Error(
      `Не удалось отправить сообщение ни одним из доступных сендеров`,
    );
  };

  return { isSupports, send };
};
