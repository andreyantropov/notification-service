import { Sender } from "../../../../../domain/ports/Sender.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";
import { DeliveryStrategy } from "../../types/DeliveryStrategy.js";

const sendToRecipient = async (
  recipient: Recipient,
  message: string,
  senders: Sender[],
  onError: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void,
): Promise<boolean> => {
  if (!senders || senders.length === 0) {
    onError(
      { recipient, message },
      new Error(
        `Для адресата ${recipient} не указано ни одного доступного канала`,
      ),
    );
    return false;
  }

  for (const sender of senders) {
    try {
      await sender.send(recipient, message);
      return true;
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

  onError(
    { recipient, message },
    new Error(`Не удалось доставить уведомление адресату ${recipient}`),
  );
  return false;
};

export const sendToAllAvailableStrategy: DeliveryStrategy = async (
  senders,
  { recipients, message },
  onError = () => {},
): Promise<void> => {
  if (!recipients || recipients.length === 0) {
    throw new Error("Нет получателя для доставки уведомления");
  }

  const sendMessages = recipients.map((recipient) => {
    const supportedSenders = senders.filter((sender) =>
      sender.isSupports(recipient),
    );
    return sendToRecipient(recipient, message, supportedSenders, onError);
  });

  const results = await Promise.all(sendMessages);

  const isError = results.every((result) => result === false);
  if (isError) {
    throw new Error(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  }
};
