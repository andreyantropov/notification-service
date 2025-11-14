import { asFunction, AwilixContainer } from "awilix";

import { createNotificationDeliveryService } from "../../../application/services/createNotificationDeliveryService/index.js";
import { createLoggedNotificationDeliveryService } from "../../../application/services/createNotificationDeliveryService/index.js";
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
    notificationDeliveryService: asFunction(({ tracer, logger }) => {
      const bitrixChannel = createBitrixChannel(bitrixConfig);
      const smtpChannel = createSmtpChannel(smtpConfig);

      const tracedSmtpChannel = createTracedChannel({
        channel: smtpChannel,
        tracer,
      });

      const loggedBitrixChannel = createLoggedChannel({
        channel: bitrixChannel,
        logger,
      });
      const loggedTracedSmtpChannel = createLoggedChannel({
        channel: tracedSmtpChannel,
        logger,
      });

      const notificationDeliveryService = createNotificationDeliveryService({
        channels: [loggedBitrixChannel, loggedTracedSmtpChannel],
      });

      const loggedNotificationDeliveryService =
        createLoggedNotificationDeliveryService({
          notificationDeliveryService,
          logger,
        });

      return loggedNotificationDeliveryService;
    }).singleton(),
  });
};
