import { asFunction, AwilixContainer } from "awilix";

import { createNotificationDeliveryService } from "../../../application/services/createNotificationDeliveryService/createNotificationDeliveryService.js";
import { bitrixConfig } from "../../../configs/bitrix.config.js";
import { smtpConfig } from "../../../configs/smtp.config.js";
import { createBitrixSender } from "../../../infrastructure/senders/createBitrixSender/createBitrixSender.js";
import { createSmtpSender } from "../../../infrastructure/senders/createSmtpSender/createSmtpSender.js";
import { Container } from "../../types/Container.js";

export const registerServices = (container: AwilixContainer<Container>) => {
  container.register({
    notificationDeliveryService: asFunction(() => {
      const bitrixSender = createBitrixSender(bitrixConfig);
      const smtpSender = createSmtpSender(smtpConfig);

      return createNotificationDeliveryService({
        senders: [bitrixSender, smtpSender],
      });
    }).singleton(),
  });
};
