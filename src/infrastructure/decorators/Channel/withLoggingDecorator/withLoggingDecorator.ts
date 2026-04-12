import { type Channel } from "../../../../domain/ports/index.js";
import { type Contact } from "../../../../domain/types/index.js";
import { EVENT_TYPE, TRIGGER_TYPE } from "../../../telemetry/index.js";

import { type LoggingDecoratorDependencies } from "./interfaces/index.js";

export const withLoggingDecorator = (
  dependencies: LoggingDecoratorDependencies,
): Channel => {
  const { channel, logger } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    const start = Date.now();
    let error: unknown;

    try {
      await channel.send(contact, message);
    } catch (err) {
      error = err;

      throw err;
    } finally {
      const durationMs = Date.now() - start;
      const isSuccess = !error;

      const log = {
        message: isSuccess
          ? `Уведомление успешно отправлено по каналу ${channel.type}`
          : `Не удалось отправить уведомление по каналу ${channel.type}`,
        eventName: "notification.send_to_channel",
        eventType: EVENT_TYPE.MESSAGING,
        trigger: TRIGGER_TYPE.API,
        durationMs,
        details: { type: channel.type, contact: contact.type },
        ...(error ? { error } : {}),
      };

      if (isSuccess) {
        logger.info(log);
      } else {
        logger.error(log);
      }
    }
  };

  return { ...channel, send };
};
