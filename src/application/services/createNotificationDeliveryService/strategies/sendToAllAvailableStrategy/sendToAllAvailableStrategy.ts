import { Sender } from "../../../../../domain/ports/Sender.js";
import { Notification } from "../../../../../domain/types/Notification.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";
import { SendResult } from "../../interfaces/SendResult.js";
import { Warning } from "../../interfaces/Warning.js";
import { DeliveryStrategy } from "../../types/DeliveryStrategy.js";
import { validateNotification } from "../utils/validateNotification/validateNotification.js";

export const sendToAllAvailableStrategy: DeliveryStrategy = async (
  notification: Notification,
  senders: Sender[],
): Promise<SendResult> => {
  const { recipients, message } = notification;

  const warnings: Warning[] = [];
  const successfulDeliveries: Array<{ recipient: Recipient; sender: string }> =
    [];

  if (!validateNotification(notification)) {
    return {
      success: false,
      notification,
      error: new Error("Нет получателя или сообщение пустое"),
    };
  }

  let atLeastOneSuccess = false;

  for (const recipient of recipients) {
    const supportedSenders = senders.filter((sender) =>
      sender.isSupports(recipient),
    );

    if (!supportedSenders || supportedSenders.length === 0) {
      warnings.push({
        message: `Для адресата ${JSON.stringify(recipient)} не указано ни одного доступного канала`,
        recipient,
      });
      continue;
    }

    for (const sender of supportedSenders) {
      try {
        await sender.send(recipient, message);
        successfulDeliveries.push({
          recipient,
          sender: sender.type,
        });
        atLeastOneSuccess = true;
      } catch (error) {
        warnings.push({
          message: `Ошибка отправки через канал ${sender.type}`,
          details: error,
          recipient,
          sender: sender.type,
        });
      }
    }
  }

  if (atLeastOneSuccess) {
    return {
      success: true,
      notification,
      details: successfulDeliveries,
      warnings,
    };
  } else {
    return {
      success: false,
      notification,
      error: new Error(
        "Не удалось отправить уведомление ни одним из доступных способов",
      ),
      warnings,
    };
  }
};
