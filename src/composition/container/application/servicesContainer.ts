import { asFunction, AwilixContainer } from "awilix";

import { createNotificationDeliveryService } from "../../../application/services/createNotificationDeliveryService/createNotificationDeliveryService.js";
import { bitrixConfig, smtpConfig } from "../../../configs/index.js";
import {
  createBitrixChannel,
  createSmtpChannel,
  createTracedChannel,
  createLoggedChannel,
} from "../../../infrastructure/channels/index.js";
import { Container } from "../../types/Container.js";

export const registerServices = (container: AwilixContainer<Container>) => {
  container.register({
    notificationDeliveryService: asFunction(
      ({ tracingContextManager, logger }) => {
        const bitrixChannel = createBitrixChannel(bitrixConfig);
        const smtpChannel = createSmtpChannel(smtpConfig);

        const tracedBitrixChannel = createTracedChannel({
          channel: bitrixChannel,
          tracingContextManager,
        });
        const tracedSmtpChannel = createTracedChannel({
          channel: smtpChannel,
          tracingContextManager,
        });

        const loggedTracedBitrixChannel = createLoggedChannel({
          channel: tracedBitrixChannel,
          logger,
        });
        const loggedTracedSmtpChannel = createLoggedChannel({
          channel: tracedSmtpChannel,
          logger,
        });

        return createNotificationDeliveryService({
          channels: [loggedTracedBitrixChannel, loggedTracedSmtpChannel],
        });
      },
    ).singleton(),
  });
};
