import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import { EventType } from "@notification-platform/shared";
import {
  retryConsumerConfig,
} from "../../configs/index.js";
import {
  createRetryConsumer,
  createLoggedConsumer,
} from "@notification-platform/queues";
import type { Container } from "../types/Container.js";

export const registerQueue = (container: AwilixContainer<Container>) => {
  container.register({
    retryConsumer: asFunction(({ retryService, logger }) => {
      const consumer = createRetryConsumer(
        { handler: retryService.getQueueName },
        {
          ...retryConsumerConfig,
          onError: (error: unknown) =>
            logger.error({
              message: `Ошибка в работе Consumer`,
              eventType: EventType.InfrastructureFailure,
              error,
            }),
        },
      );
      const loggedConsumer = createLoggedConsumer({
        consumer: consumer,
        logger,
      });

      return loggedConsumer;
    }).singleton(),
  });
};
