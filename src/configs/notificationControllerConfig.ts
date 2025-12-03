import { z } from "zod";

import { NotificationControllerConfig } from "../infrastructure/http/index.js";

const notificationControllerConfigSchema = z.object({
  sendTimeoutMs: z.coerce.number().int().positive().optional(),
});

export const notificationControllerConfig: NotificationControllerConfig =
  notificationControllerConfigSchema.parse({
    sendTimeoutMs: process.env.NOTIFICATION_CONTROLLER_SEND_TIMEOUT_MS,
  });
