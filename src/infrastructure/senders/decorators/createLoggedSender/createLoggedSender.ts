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
      loggerAdapter.info({
        message: `Уведомление успешно отправлено`,
        eventType: EventType.MessagePublish,
        details: { recipient, message },
      });
    } catch (error) {
      loggerAdapter.error({
        message: `Не удалось отправить уведомление`,
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
          loggerAdapter.debug({
            message: `Сендер ${sender.constructor.name} готов к работе`,
            eventType: EventType.HealthCheck,
          });
        } catch (error) {
          loggerAdapter.error({
            message: `Сендер ${sender.constructor.name} не отвечает`,
            eventType: EventType.HealthCheck,
            error: error,
          });
          throw error;
        }
      }
    : undefined;

  return {
    isSupports: sender.isSupports,
    send,
    checkHealth,
  };
};
