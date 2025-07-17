import {
  createNotificationDeliveryService,
  NotificationDeliveryService,
} from "../../application/services/notificationDeliveryService/index.js";
import { EventType } from "../../application/services/notificationLoggerService/index.js";
import { bitrixConfig } from "../../configs/bitrix.config.js";
import { smtpConfig } from "../../configs/smtp.config.js";
import { Recipient } from "../../domain/types/Recipient.js";
import { createBitrixSender } from "../../infrastructure/senders/bitrixSender/bitrixSender.js";
import { createFallbackSender } from "../../infrastructure/senders/fallbackSender/fallbackSender.js";
import { createSmtpSender } from "../../infrastructure/senders/smtpSender/smtpSender.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";
import { createDefaultNotificationLoggerService } from "./notificationLoggerService.js";

export const createDefaultNotificationDeliveryService =
  (): NotificationDeliveryService => {
    const notificationLoggerService = createDefaultNotificationLoggerService();

    const bitrixSender = createBitrixSender(bitrixConfig);
    const smtpSender = createSmtpSender(smtpConfig);

    const fallbackSender = createFallbackSender({
      senders: [bitrixSender, smtpSender],
      onError: (
        payload: { recipient: Recipient; message: string },
        error: Error,
      ) =>
        notificationLoggerService.writeLog({
          level: LogLevel.Warning,
          message: "Не удалось отправить уведомление по одному из каналов",
          eventType: EventType.NotificationWarning,
          spanId: "sendNotification",
          payload: payload,
          error: error,
        }),
      onHealthCheckError: (senderName: string, error: Error) =>
        notificationLoggerService.writeLog({
          level: LogLevel.Warning,
          message: `Канал ${senderName} недоступен`,
          eventType: EventType.HealthCheckWarning,
          spanId: "sendNotification",
          error: error,
        }),
    });

    const notificationDeliveryService = createNotificationDeliveryService({
      sender: fallbackSender,
    });

    return notificationDeliveryService;
  };
