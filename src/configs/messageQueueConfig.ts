import { z } from "zod";

import type { MessageQueueConfig } from "../infrastructure/queues/index.js";

const schema = z.object({
  url: z
    .string()
    .trim()
    .url(
      "url должен быть валидным URL (например, amqp://guest:guest@localhost:5672)",
    ),
});

const rawEnv = {
  url: process.env.RABBITMQ_URL,
};

export const messageQueueConfig: MessageQueueConfig = schema.parse(rawEnv);
