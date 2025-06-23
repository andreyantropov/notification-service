import "dotenv/config";
import {
  createNotificationLoggerService,
  EventType,
} from "../application/services/notificationLoggerService/index.js";
import { createNotificationProcessService } from "../application/services/notificationProcessService/index.js";
import { LogLevel } from "../shared/enums/LogLevel.js";
import { createNotificationDeliveryService } from "../application/services/notificationDeliveryService/index.js";
import {
  firebirdConfig,
  smtpConfig,
  bitrixConfig,
  influxDbLoggerConfig,
} from "../configs/index.js";
import { createDefaultSource } from "../infrastructure/fabrics/sourceFabric.js";
import { createDefaultSender } from "../infrastructure/fabrics/senderFabric.js";
import { createDefaultLogger } from "../infrastructure/fabrics/loggerFabric.js";
import { resolveRecipients } from "../application/resolvers/recipient/resolveRecipients.js";
import { Recipient } from "../domain/types/Recipient.js";
import { Log } from "../shared/interfaces/Log.js";

export const createApp = () => {
  const fallbackLogger = createDefaultLogger(
    influxDbLoggerConfig,
    {},
    (payload: Log, error: Error) => console.warn(payload, error),
  );
  const notificationLogger = createNotificationLoggerService({
    logger: fallbackLogger,
  });

  const notificationSource = createDefaultSource(firebirdConfig);

  const fallbackSender = createDefaultSender(
    bitrixConfig,
    smtpConfig,
    (payload: { recipient: Recipient; message: string }, error: Error) =>
      notificationLogger.writeLog({
        level: LogLevel.Warning,
        message: "Не удалось отправить уведомление по одному из каналов",
        eventType: EventType.SendBitrixNotification,
        spanId: "sendNotification",
        payload: payload,
        error: error,
      }),
  );
  const notificationDeliveryService = createNotificationDeliveryService({
    sender: fallbackSender,
  });

  const notificationProcessService = createNotificationProcessService({
    notificationSource: notificationSource,
    notificationDeliveryService,
    notificationLogger: notificationLogger,
    resolveRecipients: resolveRecipients,
  });

  return {
    notificationLogger,
    notificationProcessService,
  };
};
