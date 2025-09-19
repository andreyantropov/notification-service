import { asFunction, AwilixContainer } from "awilix";

import { createSendNotificationUseCase } from "../../../application/useCases/createSendNotificationUseCase/index.js";
import { Container } from "../../types/Container.js";

export const registerUseCases = (container: AwilixContainer<Container>) => {
  container.register({
    sendNotificationUseCase: asFunction(
      ({ buffer, notificationDeliveryService, loggerAdapter }) =>
        createSendNotificationUseCase({
          buffer,
          notificationDeliveryService,
          loggerAdapter,
        }),
    ).singleton(),
  });
};
