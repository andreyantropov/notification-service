import { Recipient } from "../../../domain/types/Recipient.js";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";
import { FallbackSenderConfig } from "./interfaces/FallbackSenderConfig.js";

export const createFallbackSender = ({
  senders,
  onError = () => {},
  onHealthCheckError = () => {},
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

  const checkHealth = async (): Promise<void> => {
    for (const sender of senders) {
      if (sender.checkHealth) {
        try {
          await sender.checkHealth();
          return;
        } catch (error) {
          onHealthCheckError(
            sender.constructor.name,
            new Error(`Канал ${sender.constructor.name} недоступен`, {
              cause: error,
            }),
          );
        }
      }
    }

    throw new Error("Ни один из сендров не готов к работе");
  };

  return { isSupports, send, checkHealth };
};
