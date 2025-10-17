import { asFunction, AwilixContainer } from "awilix";

import { createCheckNotificationServiceHealthUseCase } from "../../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";
import { createHandleIncomingNotificationsUseCase } from "../../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";
import { createProcessBufferedNotificationsUseCase } from "../../../application/useCases/createProcessBufferedNotificationsUseCase/createProcessBufferedNotificationsUseCase.js";
import { uuidIdGenerator } from "../../../infrastructure/generators/uuidGenerator/uuidIdGenerator.js";
import { Container } from "../../types/Container.js";

export const registerUseCases = (container: AwilixContainer<Container>) => {
  container.register({
    handleIncomingNotificationsUseCase: asFunction(
      ({ buffer, notificationDeliveryService }) =>
        createHandleIncomingNotificationsUseCase({
          buffer,
          notificationDeliveryService,
          idGenerator: uuidIdGenerator,
        }),
    ).singleton(),
    checkNotificationServiceHealthUseCase: asFunction(
      ({ notificationDeliveryService }) =>
        createCheckNotificationServiceHealthUseCase({
          notificationDeliveryService,
        }),
    ).singleton(),
    processBufferedNotificationsUseCase: asFunction(
      ({ buffer, notificationDeliveryService }) =>
        createProcessBufferedNotificationsUseCase({
          buffer,
          notificationDeliveryService,
        }),
    ).singleton(),
  });
};
