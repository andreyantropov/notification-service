import { z } from "zod";

import type { NotificationControllerConfig } from "../infrastructure/http/index.js";

const schema = z.object({
  sendTimeoutMs: z.coerce.number().int().positive().optional(),
});

const rawEnv = {
  sendTimeoutMs: process.env.NOTIFICATION_CONTROLLER_SEND_TIMEOUT_MS,
};

export const notificationControllerConfig: NotificationControllerConfig =
  schema.parse(rawEnv);
