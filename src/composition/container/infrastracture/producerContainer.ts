import { asFunction, AwilixContainer } from "awilix";

import { producerConfig } from "../../../configs/rabbitMQConfig.js";
import { Notification } from "../../../domain/types/Notification.js";
import {
  createProducer,
  createLoggedProducer,
} from "../../../infrastructure/queues/rabbitMQ/producers/index.js";
import { Container } from "../../types/Container.js";

export const registerProducer = (container: AwilixContainer<Container>) => {
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
  });
};
