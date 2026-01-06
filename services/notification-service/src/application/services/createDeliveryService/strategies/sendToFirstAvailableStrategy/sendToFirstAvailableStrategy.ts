import type { Channel } from "../../../../../domain/ports/index.js";
import type { Notification } from "@notification-platform/shared";
import type { Result, Warning } from "../../interfaces/index.js";
import type { Strategy } from "../../types/index.js";

export const sendToFirstAvailableStrategy: Strategy = async (
  notification: Notification,
  channels: readonly Channel[],
): Promise<Result> => {
  const { contacts, message } = notification;

  const warnings: Warning[] = [];

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
          status: "success",
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
    status: "failure",
    notification,
    error: new Error(
      "Не удалось отправить уведомление ни одним из доступных способов",
    ),
    warnings,
  };
};
