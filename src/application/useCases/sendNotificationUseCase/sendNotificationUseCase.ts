import { Notification } from "../../../domain/interfaces/Notification.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { EventType } from "../../services/notificationLoggerService/index.js";
import { SendNotificationUseCase } from "./interfaces/SendNotificationUseCase.js";
import { SendNotificationUseCaseConfig } from "./interfaces/SendNotificationUseCaseConfig.js";

export const createSendNotificationUseCase = ({
  notificationDeliveryService,
  notificationLoggerService,
}: SendNotificationUseCaseConfig): SendNotificationUseCase => {
  const send = async ({ recipients, message }: Notification): Promise<void> => {
    try {
      await notificationDeliveryService.send({ recipients, message });
      notificationLoggerService.writeLog({
        level: LogLevel.Info,
        message: `Уведомление успешно отправлено`,
        eventType: EventType.NotificationSuccess,
        spanId: `createSendNotificationUseCase`,
        payload: {
          recipients,
          message,
        },
      });
    } catch (error) {
      notificationLoggerService.writeLog({
        level: LogLevel.Error,
        message: `Не удалось отправить уведомление`,
        eventType: EventType.NotificationError,
        spanId: `createSendNotificationUseCase`,
        payload: {
          recipients,
          message,
        },
        error: error,
      });
      throw error;
    }
  };

  return { send };
};
