import { asFunction, AwilixContainer } from "awilix";

import {
  createMeteredNotificationDeliveryService,
  createNotificationDeliveryService,
  createLoggedNotificationDeliveryService,
} from "../../application/services/createNotificationDeliveryService/index.js";
import { createNotificationRetryService } from "../../application/services/createNotificationRetryService/index.js";
import { Container } from "../types/index.js";

export const registerServices = (container: AwilixContainer<Container>) => {
  container.register({
    notificationDeliveryService: asFunction(
      ({ bitrixChannel, emailChannel, logger, meter }) => {
        const notificationDeliveryService = createNotificationDeliveryService({
          channels: [bitrixChannel, emailChannel],
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
      },
    ).singleton(),
    notificationRetryService: asFunction(() => {
      const notificationRetryService = createNotificationRetryService();

      return notificationRetryService;
    }).singleton(),
  });
};
