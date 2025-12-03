import { z } from "zod";

import { messageQueueConfig } from "./messageQueueConfig.js";
import { RetryConsumerConfig } from "../infrastructure/queues/index.js";

const { url } = messageQueueConfig;

const retryConsumerConfigSchema = z.object({
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
  nackOptions: z
    .object({
      requeue: z.coerce.boolean().optional(),
      multiple: z.coerce.boolean().optional(),
    })
    .optional(),
  retryPublishTimeoutMs: z.coerce.number().int().positive().optional(),
  healthcheckTimeoutMs: z.coerce.number().int().positive().optional(),
});

export const retryConsumerConfig: RetryConsumerConfig =
  retryConsumerConfigSchema.parse({
    url,
    queue: process.env.RETRY_CONSUMER_QUEUE,
    nackOptions: {
      requeue: process.env.RETRY_CONSUMER_REQUEUE,
      multiple: process.env.RETRY_CONSUMER_MULTIPLE,
    },
    retryPublishTimeoutMs: process.env.RETRY_CONSUMER_RETRY_PUBLISH_TIMEOUT_MS,
    healthcheckTimeoutMs: process.env.RETRY_CONSUMER_HEALTHCHECK_TIMEOUT_MS,
  });
