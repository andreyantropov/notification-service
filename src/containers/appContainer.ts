import "dotenv/config";
import {
  createNotificationLoggerService,
  EventType,
} from "../application/services/notificationLoggerService/index.js";
import { LogLevel } from "../shared/enums/LogLevel.js";
import { createNotificationDeliveryService } from "../application/services/notificationDeliveryService/index.js";
import {
  smtpConfig,
  bitrixConfig,
  influxDbLoggerConfig,
  serverConfig,
} from "../configs/index.js";
import { Recipient } from "../domain/types/Recipient.js";
import { Log } from "../shared/interfaces/Log.js";
import { createSendNotificationUseCase } from "../application/useCases/sendNotificationUseCase/sendNotificationUseCase.js";
import { createDefaultApp } from "../api/fabrics/appFabric/appFabric.js";
import { createDefaultLogger } from "../shared/infrastructure/fabrics/loggerFabric/index.js";
import { createDefaultSender } from "../infrastructure/fabrics/senderFabric/index.js";

export const createApp = () => {
  const fallbackLogger = createDefaultLogger({
    influxDbLoggerConfig,
    localFileLoggerConfig: {},
    onError: (payload: Log, error: Error) => console.warn(payload, error),
  });
  const notificationLoggerService = createNotificationLoggerService({
    logger: fallbackLogger,
  });

  const fallbackSender = createDefaultSender({
    bitrixConfig,
    smtpConfig,
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

  const sendNotificationUseCase = createSendNotificationUseCase({
    notificationDeliveryService,
    notificationLoggerService,
  });

  const server = createDefaultApp({
    serverConfig,
    sendNotificationUseCase,
    notificationLoggerService,
  });

  return {
    server,
    notificationLoggerService,
  };
};
