import { asFunction, AwilixContainer } from "awilix";

import { EventType } from "../../../application/enums/index.js";
import {
  batchConsumerConfig,
  producerConfig,
  retryConsumerConfig,
} from "../../../configs/rabbitMQConfig.js";
import { Notification } from "../../../domain/types/Notification.js";
import { createBatchConsumer } from "../../../infrastructure/queues/rabbitMQ/consumers/createBatchConsumer/index.js";
import {
  createLoggedConsumer,
  createRetryConsumer,
} from "../../../infrastructure/queues/rabbitMQ/consumers/index.js";
import {
  createLoggedProducer,
  createProducer,
} from "../../../infrastructure/queues/rabbitMQ/producers/index.js";
import { Container } from "../../types/Container.js";

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
    batchConsumer: asFunction(({ notificationDeliveryService, logger }) => {
      const consumer = createBatchConsumer<Notification>(
        { handler: notificationDeliveryService.send },
        {
          url: batchConsumerConfig.url,
          queue: batchConsumerConfig.queue,
          maxBatchSize: batchConsumerConfig.maxBatchSize,
          batchSizeFlushTimeoutMs: batchConsumerConfig.batchSizeFlushTimeoutMs,
          nackOptions: { requeue: false, multiple: false },
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
    retryConsumer: asFunction(({ notificationRetryService, logger }) => {
      const consumer = createRetryConsumer(
        { handler: notificationRetryService.getQueueName },
        {
          url: retryConsumerConfig.url,
          queue: retryConsumerConfig.queue,
          nackOptions: { requeue: false, multiple: false },
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
