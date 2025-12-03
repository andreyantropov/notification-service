import { Channel } from "../../../../../domain/ports/index.js";
import { Notification } from "../../../../../domain/types/index.js";
import { DeliveryResult, Warning } from "../../interfaces/index.js";
import { DeliveryStrategy } from "../../types/index.js";
import { validateNotification } from "../utils/index.js";

export const sendToFirstAvailableStrategy: DeliveryStrategy = async (
  notification: Notification,
  channels: readonly Channel[],
): Promise<DeliveryResult> => {
  const { contacts, message } = notification;

  const warnings: Warning[] = [];

  if (!validateNotification(notification)) {
    return {
      success: false,
      notification,
      error: new Error("Нет получателя или сообщение пустое"),
    };
  }

  for (const contact of contacts) {
    const supportedChannels = channels.filter((channel) =>
      channel.isSupports(contact),
    );

    if (!supportedChannels || supportedChannels.length === 0) {
      warnings.push({
        message: `Для адресата ${JSON.stringify(contact)} не указано ни одного доступного канала`,
        contact: contact.type,
      });
      continue;
    }

    for (const channel of supportedChannels) {
      try {
        await channel.send(contact, message);
        return {
          success: true,
          notification,
          details: {
            contact,
            channel: channel.type,
          },
          warnings,
        };
      } catch (error) {
        warnings.push({
          message: `Ошибка отправки через канал ${channel.type}`,
          details: error,
          contact: contact.type,
          channel: channel.type,
        });
      }
    }
  }

  return {
    success: false,
    notification,
    error: new Error(
      "Не удалось отправить уведомление ни одним из доступных способов",
    ),
    warnings,
  };
};
