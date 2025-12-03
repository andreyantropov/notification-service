import { z } from "zod";

import { messageQueueConfig } from "./messageQueueConfig.js";
import { BatchConsumerConfig } from "../infrastructure/queues/index.js";

const { url } = messageQueueConfig;

const batchConsumerConfigSchema = z.object({
  url: z
    .string()
    .trim()
    .url(
      "url должен быть валидным URL (например, amqp://guest:guest@localhost:5672)",
    ),
  queue: z
    .string()
    .trim()
    .min(3, "queue должен быть не короче 3 символов")
    .max(256, "queue не должен превышать 256 символов"),
  maxBatchSize: z.coerce.number().int().positive().optional(),
  batchFlushTimeoutMs: z.coerce.number().int().positive().optional(),
  nackOptions: z
    .object({
      requeue: z.coerce.boolean().optional(),
      multiple: z.coerce.boolean().optional(),
    })
    .optional(),
  flushTimeoutMs: z.coerce.number().int().positive().optional(),
  healthcheckTimeoutMs: z.coerce.number().int().positive().optional(),
});

export const batchConsumerConfig: BatchConsumerConfig =
  batchConsumerConfigSchema.parse({
    url,
    queue: process.env.BATCH_CONSUMER_QUEUE,
    maxBatchSize: process.env.BATCH_CONSUMER_MAX_BATCH_SIZE,
    batchFlushTimeoutMs: process.env.BATCH_CONSUMER_BATCH_FLUSH_TIMEOUT_MS,
    nackOptions: {
      requeue: process.env.BATCH_CONSUMER_REQUEUE,
      multiple: process.env.BATCH_CONSUMER_MULTIPLE,
    },
    flushTimeoutMs: process.env.BATCH_CONSUMER_FLUSH_TIMEOUT_MS,
    healthcheckTimeoutMs: process.env.BATCH_CONSUMER_HEALTHCHECK_TIMEOUT_MS,
  });
