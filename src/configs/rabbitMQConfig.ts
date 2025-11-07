import { z } from "zod";

import {
  BatchConsumerConfig,
  RetryConsumerConfig,
} from "../infrastructure/queues/rabbitMQ/consumers/index.js";
import { ProducerConfig } from "../infrastructure/queues/rabbitMQ/producers/index.js";

const producerConfigSchema = z.object({
  url: z
    .string()
    .url(
      "Некорректный URL RabbitMQ: должно быть валидным URL (например, http://localhost:8086)",
    ),
  queue: z.string().min(1, "queue не может быть пустым"),
});

const batchConsumerConfigSchema = z.object({
  url: z
    .string()
    .url(
      "Некорректный URL RabbitMQ: должно быть валидным URL (например, http://localhost:8086)",
    ),
  maxBatchSize: z.coerce.number().int().positive().default(1000),
  batchFlushTimeout: z.coerce.number().int().positive().default(60_000),
  queue: z.string().min(1, "queue не может быть пустым"),
});

const retryConsumerConfigSchema = z.object({
  url: z
    .string()
    .url(
      "Некорректный URL RabbitMQ: должно быть валидным URL (например, http://localhost:8086)",
    ),
  queue: z.string().min(1, "queue не может быть пустым"),
});

export const producerConfig: ProducerConfig = {
  ...producerConfigSchema.parse({
    url: process.env.RABBIT_URL,
    queue: process.env.RABBIT_MAIN_QUEUE,
  }),
};

export const batchConsumerConfig: BatchConsumerConfig = {
  ...batchConsumerConfigSchema.parse({
    url: process.env.RABBIT_URL,
    maxBatchSize: process.env.RABBIT_MAX_BATCH_SIZE,
    batchFlushTimeout: process.env.RABBIT_BATCH_FLUSH_TIMEOUT,
    queue: process.env.RABBIT_MAIN_QUEUE,
  }),
};

export const retryConsumerConfig: RetryConsumerConfig = {
  ...retryConsumerConfigSchema.parse({
    url: process.env.RABBIT_URL,
    queue: process.env.RABBIT_RETRY_QUEUE,
  }),
};
