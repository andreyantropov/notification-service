import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import { createCheckHealthUseCase } from "../../application/useCases/createCheckHealthUseCase/index.js";
import { createHandleIncomingNotificationsUseCase } from "../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";
import type { Container } from "../types/index.js";

export const registerUseCases = (container: AwilixContainer<Container>) => {
  container.register({
    handleIncomingNotificationsUseCase: asFunction(
      ({ generator, producer, deliveryService }) => {
        const hanldeIncomingNotificationUseCase =
          createHandleIncomingNotificationsUseCase({
            producer,
            deliveryService,
            idGenerator: generator,
          });

        return hanldeIncomingNotificationUseCase;
      },
    ).singleton(),
    checkHealthUseCase: asFunction(
      ({ deliveryService, producer, batchConsumer }) => {
        const checkNotificationServiceHealth = createCheckHealthUseCase({
          deliveryService,
          producer,
          batchConsumer,
        });

        return checkNotificationServiceHealth;
      },
    ).singleton(),
  });
};
