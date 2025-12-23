import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import {
  createMeteredDeliveryService,
  createDeliveryService,
  createLoggedDeliveryService,
} from "../../application/services/createDeliveryService/index.js";
import {
  createLoggedRetryService,
  createMeteredRetryService,
  createRetryService,
} from "../../application/services/createRetryService/index.js";
import type { Container } from "../types/index.js";

export const registerServices = (container: AwilixContainer<Container>) => {
  container.register({
    deliveryService: asFunction(
      ({ bitrixChannel, emailChannel, logger, meter }) => {
        const channels = [bitrixChannel, emailChannel].filter(
          (channel): channel is NonNullable<typeof channel> =>
            channel != undefined,
        );

        const deliveryService = createDeliveryService({
          channels,
        });
        const loggedDeliveryService = createLoggedDeliveryService({
          deliveryService,
          logger,
        });
        const meteredLoggedDeliveryService = createMeteredDeliveryService({
          deliveryService: loggedDeliveryService,
          meter,
        });

        return meteredLoggedDeliveryService;
      },
    ).singleton(),
    retryService: asFunction(({ logger, meter }) => {
      const retryService = createRetryService();
      const loggedRetryService = createLoggedRetryService({
        retryService,
        logger,
      });
      const meteredLoggedRetryService = createMeteredRetryService({
        retryService: loggedRetryService,
        meter,
      });

      return meteredLoggedRetryService;
    }).singleton(),
  });
};
