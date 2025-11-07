import { asFunction, AwilixContainer } from "awilix";

import { createCheckNotificationServiceHealthUseCase } from "../../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";
import { createHandleIncomingNotificationsUseCase } from "../../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";
import { uuidIdGenerator } from "../../../infrastructure/generators/uuidGenerator/uuidIdGenerator.js";
import { Container } from "../../types/Container.js";

export const registerUseCases = (container: AwilixContainer<Container>) => {
  container.register({
    handleIncomingNotificationsUseCase: asFunction(
      ({ producer, notificationDeliveryService }) =>
        createHandleIncomingNotificationsUseCase({
          producer,
          notificationDeliveryService,
          idGenerator: uuidIdGenerator,
        }),
    ).singleton(),
    checkNotificationServiceHealthUseCase: asFunction(
      ({
        notificationDeliveryService,
        producer,
        batchConsumer,
        retryConsumer,
      }) =>
        createCheckNotificationServiceHealthUseCase({
          notificationDeliveryService,
          producer,
          batchConsumer,
          retryConsumer,
        }),
    ).singleton(),
  });
};
