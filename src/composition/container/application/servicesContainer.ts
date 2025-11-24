import { asFunction, AwilixContainer } from "awilix";

import {
  createMeteredNotificationDeliveryService,
  createNotificationDeliveryService,
} from "../../../application/services/createNotificationDeliveryService/index.js";
import { createLoggedNotificationDeliveryService } from "../../../application/services/createNotificationDeliveryService/index.js";
import { createNotificationRetryService } from "../../../application/services/createNotificationRetryService/index.js";
import { bitrixConfig, smtpConfig } from "../../../configs/index.js";
import {
  createBitrixChannel,
  createSmtpChannel,
  createTracedChannel,
  createLoggedChannel,
  createMeteredChannel,
} from "../../../infrastructure/channels/index.js";
import { Container } from "../../types/Container.js";

export const registerServices = (container: AwilixContainer<Container>) => {
  container.register({
    notificationDeliveryService: asFunction(({ tracer, logger, meter }) => {
      const smtpChannel = createSmtpChannel(smtpConfig);
      const tracedSmtpChannel = createTracedChannel({
        channel: smtpChannel,
        tracer,
      });
      const loggedTracedSmtpChannel = createLoggedChannel({
        channel: tracedSmtpChannel,
        logger,
      });
      const meteredLoggedTracedSmtpChannel = createMeteredChannel({
        channel: loggedTracedSmtpChannel,
        meter,
      });

      const bitrixChannel = createBitrixChannel(bitrixConfig);
      const loggedBitrixChannel = createLoggedChannel({
        channel: bitrixChannel,
        logger,
      });
      const meteredLoggedBitrixChannel = createMeteredChannel({
        channel: loggedBitrixChannel,
        meter,
      });

      const notificationDeliveryService = createNotificationDeliveryService({
        channels: [meteredLoggedBitrixChannel, meteredLoggedTracedSmtpChannel],
      });
      const loggedNotificationDeliveryService =
        createLoggedNotificationDeliveryService({
          notificationDeliveryService,
          logger,
        });
      const meteredLoggedNotificationDeliveryService =
        createMeteredNotificationDeliveryService({
          notificationDeliveryService: loggedNotificationDeliveryService,
          meter,
        });

      return meteredLoggedNotificationDeliveryService;
    }).singleton(),
    notificationRetryService: asFunction(() =>
      createNotificationRetryService(),
    ).singleton(),
  });
};
