import type { LoggedChannelDependencies } from "./interfaces/index.js";
import { EventType } from "../../../../application/enums/index.js";
import type { Channel } from "../../../../domain/ports/index.js";
import type { Contact } from "../../../../domain/types/index.js";

export const createLoggedChannel = (
  dependencies: LoggedChannelDependencies,
): Channel => {
  const { channel, logger } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    const start = Date.now();
    try {
      await channel.send(contact, message);
      const durationMs = Date.now() - start;
      logger.info({
        message: `Уведомление успешно отправлено по каналу ${channel.type}`,
        eventType: EventType.MessagePublish,
        durationMs,
        details: { channelType: channel.type, contactType: contact.type },
      });
    } catch (error) {
      const durationMs = Date.now() - start;
      logger.error({
        message: `Не удалось отправить уведомление по каналу ${channel.type}`,
        eventType: EventType.MessagePublish,
        durationMs,
        details: { channelType: channel.type, contactType: contact.type },
        error,
      });
      throw error;
    }
  };

  const checkHealth = channel.checkHealth
    ? async (): Promise<void> => {
        const start = Date.now();
        try {
          await channel.checkHealth!();
          const durationMs = Date.now() - start;
          logger.debug({
            message: `Канал ${channel.type} готов к работе`,
            eventType: EventType.HealthCheck,
            durationMs,
            details: { channelType: channel.type },
          });
        } catch (error) {
          const durationMs = Date.now() - start;
          logger.error({
            message: `Канал ${channel.type} не отвечает`,
            eventType: EventType.HealthCheck,
            durationMs,
            details: { channelType: channel.type },
            error,
          });
          throw error;
        }
      }
    : undefined;

  return {
    type: channel.type,
    isSupports: channel.isSupports,
    send,
    checkHealth,
  };
};
