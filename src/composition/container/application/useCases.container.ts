import { asFunction, AwilixContainer } from "awilix";

import { createSendNotificationUseCase } from "../../../application/useCases/createSendNotificationUseCase/index.js";
import { uuidIdGenerator } from "../../../infrastructure/generator/uuidGenerator/uuidIdGenerator.js";
import { Container } from "../../types/Container.js";

export const registerUseCases = (container: AwilixContainer<Container>) => {
  container.register({
    sendNotificationUseCase: asFunction(
      ({ buffer, notificationDeliveryService }) =>
        createSendNotificationUseCase({
          buffer,
          notificationDeliveryService,
          idGenerator: uuidIdGenerator,
        }),
    ).singleton(),
  });
};
