import { LoggedSenderDependencies } from "./interfaces/LoggedSenderDependencies.js";
import { Sender } from "../../../../domain/ports/Sender.js";
import { Recipient } from "../../../../domain/types/Recipient.js";
import { EventType } from "../../../../shared/enums/EventType.js";

export const createLoggedSender = (
  dependencies: LoggedSenderDependencies,
): Sender => {
  const { sender, loggerAdapter } = dependencies;

  const send = async (recipient: Recipient, message: string): Promise<void> => {
    try {
      await sender.send(recipient, message);
      await loggerAdapter.info({
        message: `Уведомление успешно отправлено по каналу ${sender.type}`,
        eventType: EventType.MessagePublish,
        details: { recipient, message },
      });
    } catch (error) {
      await loggerAdapter.error({
        message: `Не удалось отправить уведомление по каналу ${sender.type}`,
        eventType: EventType.MessagePublish,
        details: { recipient, message },
        error: error,
      });
      throw error;
    }
  };

  const checkHealth = sender.checkHealth
    ? async (): Promise<void> => {
        try {
          await sender.checkHealth!();
          await loggerAdapter.debug({
            message: `Сендер ${sender.type} готов к работе`,
            eventType: EventType.HealthCheck,
          });
        } catch (error) {
          await loggerAdapter.error({
            message: `Сендер ${sender.type} не отвечает`,
            eventType: EventType.HealthCheck,
            error: error,
          });
          throw error;
        }
      }
    : undefined;

  return {
    type: sender.type,
    isSupports: sender.isSupports,
    send,
    checkHealth,
  };
};
