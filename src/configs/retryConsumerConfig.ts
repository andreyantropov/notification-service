import { z } from "zod";

import { messageQueueConfig } from "./messageQueueConfig.js";
import type { RetryConsumerConfig } from "../infrastructure/queues/index.js";

const { url } = messageQueueConfig;

const schema = z.object({
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
      requeue: z
        .string()
        .trim()
        .toLowerCase()
        .transform((s) => s === "true")
        .optional(),
      multiple: z
        .string()
        .trim()
        .toLowerCase()
        .transform((s) => s === "true")
        .optional(),
    })
    .optional(),
  retryPublishTimeoutMs: z.coerce.number().int().positive().optional(),
  healthcheckTimeoutMs: z.coerce.number().int().positive().optional(),
});

const rawEnv = {
  url,
  queue: process.env.RETRY_CONSUMER_QUEUE,
  nackOptions: {
    requeue: process.env.RETRY_CONSUMER_REQUEUE,
    multiple: process.env.RETRY_CONSUMER_MULTIPLE,
  },
  retryPublishTimeoutMs: process.env.RETRY_CONSUMER_RETRY_PUBLISH_TIMEOUT_MS,
  healthcheckTimeoutMs: process.env.RETRY_CONSUMER_HEALTHCHECK_TIMEOUT_MS,
};

export const retryConsumerConfig: RetryConsumerConfig = schema.parse(rawEnv);
