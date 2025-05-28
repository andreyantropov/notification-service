import "dotenv/config";
import {
  createNotificationLoggerService,
  EventType,
} from "../application/services/notificationLoggerService";
import { createNotificationProcessService } from "../application/services/notificationProcessService";
import { LogLevel } from "../shared/enums/LogLevel";
import { createNotificationDeliveryService } from "../application/services/notificationDeliveryService";
import {
  firebirdConfig,
  smtpConfig,
  bitrixConfig,
  influxDbLoggerConfig,
} from "../configs";
import { createDefaultSource } from "../infrastructure/fabrics/sourceFabric";
import { createDefaultSender } from "../infrastructure/fabrics/senderFabric";
import { createDefaultLogger } from "../infrastructure/fabrics/loggerFabric";
import { resolveRecipients } from "../application/resolvers/recipient/resolveRecipients";
import { Recipient } from "../domain/types/Recipient";
import { Log } from "../shared/interfaces/Log";

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
