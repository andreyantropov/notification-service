import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import { EventType } from "../../application/enums/index.js";
import {
  batchConsumerConfig,
  producerConfig,
  retryConsumerConfig,
} from "../../configs/index.js";
import type { Notification } from "../../domain/types/Notification.js";
import {
  createBatchConsumer,
  createLoggedConsumer,
  createRetryConsumer,
  createLoggedProducer,
  createProducer,
} from "../../infrastructure/queues/index.js";
import type { Container } from "../types/Container.js";

export const registerQueue = (container: AwilixContainer<Container>) => {
  container.register({
    producer: asFunction(({ logger }) => {
      const producer = createProducer<Notification>({
        url: producerConfig.url,
        queue: producerConfig.queue,
      });
      const loggedProducer = createLoggedProducer<Notification>({
        producer: producer,
        logger,
      });

      return loggedProducer;
    }).singleton(),
    batchConsumer: asFunction(({ deliveryService, logger }) => {
      const consumer = createBatchConsumer<Notification>(
        { handler: deliveryService.send },
        {
          ...batchConsumerConfig,
          onError: (error) =>
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
    retryConsumer: asFunction(({ retryService, logger }) => {
      const consumer = createRetryConsumer(
        { handler: retryService.getQueueName },
        {
          ...retryConsumerConfig,
          onError: (error) =>
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
