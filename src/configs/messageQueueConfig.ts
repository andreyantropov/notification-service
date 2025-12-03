import { z } from "zod";

import { MessageQueueConfig } from "../infrastructure/queues/index.js";

const messageQueueConfigSchema = z.object({
  url: z
    .string()
    .trim()
    .url(
      "url должен быть валидным URL (например, amqp://guest:guest@localhost:5672)",
    ),
});

export const messageQueueConfig: MessageQueueConfig =
  messageQueueConfigSchema.parse({
    url: process.env.RABBITMQ_URL,
  });
