import { asFunction, AwilixContainer } from "awilix";
import { Container } from "../../types/Container.js";
import { createNotificationDeliveryService } from "../../../application/services/createNotificationDeliveryService/createNotificationDeliveryService.js";
import { bitrixConfig } from "../../../configs/bitrix.config.js";
import { smtpConfig } from "../../../configs/smtp.config.js";
import { Recipient } from "../../../domain/types/Recipient.js";
import { createBitrixSender } from "../../../infrastructure/senders/createBitrixSender/createBitrixSender.js";
import { createSmtpSender } from "../../../infrastructure/senders/createSmtpSender/createSmtpSender.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";

export const registerServices = (container: AwilixContainer<Container>) => {
  container.register({
    notificationDeliveryService: asFunction(({ loggerAdapter }) => {
      const bitrixSender = createBitrixSender(bitrixConfig);
      const smtpSender = createSmtpSender(smtpConfig);

      return createNotificationDeliveryService(
        [bitrixSender, smtpSender],
        undefined,
        {
          onError: (
            payload: { recipient: Recipient; message: string },
            error: Error,
          ) =>
            loggerAdapter.writeLog({
              level: LogLevel.Warning,
              message: "Не удалось отправить уведомление по одному из каналов",
              eventType: EventType.NotificationWarning,
              spanId: "sendNotification",
              payload,
              error,
            }),
        },
      );
    }).singleton(),
  });
};
