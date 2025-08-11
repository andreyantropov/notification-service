import {
  createNotificationDeliveryService,
  NotificationDeliveryService,
} from "../../../application/services/createNotificationDeliveryService/index.js";
import { EventType } from "../../../application/services/createNotificationLoggerService/index.js";
import { bitrixConfig } from "../../../configs/bitrix.config.js";
import { smtpConfig } from "../../../configs/smtp.config.js";
import { Recipient } from "../../../domain/types/Recipient.js";
import { createBitrixSender } from "../../../infrastructure/senders/createBitrixSender/createBitrixSender.js";
import { createFallbackSender } from "../../../infrastructure/senders/createFallbackSender/createFallbackSender.js";
import { createSmtpSender } from "../../../infrastructure/senders/createSmtpSender/createSmtpSender.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { getNotificationLoggerServiceInstance } from "./getNotificationLoggerServiceInstance.js";

let instance: NotificationDeliveryService | null = null;

export const getNotificationDeliveryServiceInstance =
  (): NotificationDeliveryService => {
    if (instance === null) {
      const notificationLoggerService = getNotificationLoggerServiceInstance();

      const bitrixSender = createBitrixSender(bitrixConfig);
      const smtpSender = createSmtpSender(smtpConfig);

      const fallbackSender = createFallbackSender([bitrixSender, smtpSender], {
        onError: (
          payload: { recipient: Recipient; message: string },
          error: Error,
        ) =>
          notificationLoggerService.writeLog({
            level: LogLevel.Warning,
            message: "Не удалось отправить уведомление по одному из каналов",
            eventType: EventType.NotificationWarning,
            spanId: "sendNotification",
            payload,
            error,
          }),
        onHealthCheckError: (senderName: string, error: Error) =>
          notificationLoggerService.writeLog({
            level: LogLevel.Warning,
            message: `Канал ${senderName} недоступен`,
            eventType: EventType.HealthCheckWarning,
            spanId: "sendNotification",
            error,
          }),
      });

      instance = createNotificationDeliveryService(fallbackSender);
    }

    return instance;
  };
