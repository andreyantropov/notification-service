import { asFunction, AwilixContainer } from "awilix";

import { createNotificationDeliveryService } from "../../../application/services/createNotificationDeliveryService/createNotificationDeliveryService.js";
import { bitrixConfig } from "../../../configs/bitrix.config.js";
import { smtpConfig } from "../../../configs/smtp.config.js";
import { createBitrixSender } from "../../../infrastructure/senders/createBitrixSender/createBitrixSender.js";
import { createSmtpSender } from "../../../infrastructure/senders/createSmtpSender/createSmtpSender.js";
import { createLoggedSender } from "../../../infrastructure/senders/decorators/createLoggedSender/index.js";
import { createTracedSender } from "../../../infrastructure/senders/decorators/createTracedSender/index.js";
import { Container } from "../../types/Container.js";

export const registerServices = (container: AwilixContainer<Container>) => {
  container.register({
    notificationDeliveryService: asFunction(
      ({ tracingContextManager, loggerAdapter }) => {
        const bitrixSender = createBitrixSender(bitrixConfig);
        const smtpSender = createSmtpSender(smtpConfig);

        const tracedBitrixSender = createTracedSender({
          sender: bitrixSender,
          tracingContextManager,
        });
        const tracedSmtpSender = createTracedSender({
          sender: smtpSender,
          tracingContextManager,
        });

        const loggedTracedBitrixSender = createLoggedSender({
          sender: tracedBitrixSender,
          loggerAdapter,
        });
        const loggedTracedSmtpSender = createLoggedSender({
          sender: tracedSmtpSender,
          loggerAdapter,
        });

        return createNotificationDeliveryService({
          senders: [loggedTracedBitrixSender, loggedTracedSmtpSender],
        });
      },
    ).singleton(),
  });
};
