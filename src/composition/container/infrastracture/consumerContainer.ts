import { asFunction, AwilixContainer } from "awilix";

import { EventType } from "../../../application/enums/index.js";
import {
  batchConsumerConfig,
  retryConsumerConfig,
} from "../../../configs/rabbitMQConfig.js";
import { Notification } from "../../../domain/types/Notification.js";
import { createBatchConsumer } from "../../../infrastructure/queues/rabbitMQ/consumers/createBatchConsumer/index.js";
import {
  createLoggedConsumer,
  createRetryConsumer,
} from "../../../infrastructure/queues/rabbitMQ/consumers/index.js";
import { Container } from "../../types/Container.js";

export const registerConsumer = (container: AwilixContainer<Container>) => {
  container.register({
    batchConsumer: asFunction(({ notificationDeliveryService, logger }) => {
      const consumer = createBatchConsumer<Notification>(
        { handler: notificationDeliveryService.send },
        {
          url: batchConsumerConfig.url,
          queue: batchConsumerConfig.queue,
          maxBatchSize: batchConsumerConfig.maxBatchSize,
          batchSizeFlushTimeoutMs: batchConsumerConfig.batchSizeFlushTimeoutMs,
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
    retryConsumer: asFunction(({ logger }) => {
      const consumer = createRetryConsumer({
        url: retryConsumerConfig.url,
        queue: retryConsumerConfig.queue,
        onError: (error) =>
          logger.error({
            message: `Ошибка в работе Consumer`,
            eventType: EventType.InfrastructureFailure,
            error,
          }),
      });
      const loggedConsumer = createLoggedConsumer({
        consumer: consumer,
        logger,
      });

      return loggedConsumer;
    }).singleton(),
  });
};
