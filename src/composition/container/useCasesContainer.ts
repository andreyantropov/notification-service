import { asFunction, AwilixContainer } from "awilix";

import { createCheckNotificationServiceHealthUseCase } from "../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";
import { createHandleIncomingNotificationsUseCase } from "../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";
import { Container } from "../types/index.js";

export const registerUseCases = (container: AwilixContainer<Container>) => {
  container.register({
    handleIncomingNotificationsUseCase: asFunction(
      ({ generator, producer, notificationDeliveryService }) => {
        const hanldeIncomingNotificationUseCase =
          createHandleIncomingNotificationsUseCase({
            producer,
            notificationDeliveryService,
            idGenerator: generator,
          });

        return hanldeIncomingNotificationUseCase;
      },
    ).singleton(),
    checkNotificationServiceHealthUseCase: asFunction(
      ({
        notificationDeliveryService,
        producer,
        batchConsumer,
        retryConsumer,
      }) => {
        const checkNotificationServiceHealth =
          createCheckNotificationServiceHealthUseCase({
            notificationDeliveryService,
            producer,
            batchConsumer,
            retryConsumer,
          });

        return checkNotificationServiceHealth;
      },
    ).singleton(),
  });
};
