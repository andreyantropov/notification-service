import { z } from "zod";

import { messageQueueConfig } from "./messageQueueConfig.js";
import { ProducerConfig } from "../infrastructure/queues/index.js";

const { url } = messageQueueConfig;

const producerConfigSchema = z.object({
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
  publishTimeoutMs: z.coerce.number().int().positive().optional(),
  healthcheckTimeoutMs: z.coerce.number().int().positive().optional(),
});

export const producerConfig: ProducerConfig = producerConfigSchema.parse({
  url,
  queue: process.env.PRODUCER_QUEUE,
  publishTimeoutMs: process.env.PRODUCER_PUBLISH_TIMEOUT_MS,
  healthcheckTimeoutMs: process.env.PRODUCER_HEALTHCHECK_TIMEOUT_MS,
});
