import { z } from "zod";
import { SendNotificationProcessConfig } from "../application/jobs/createSendNotificationProcess/index.js";

const processConfigSchema = z.object({
  interval: z.coerce.number().int().positive().default(60_000),
});

export const processConfig: SendNotificationProcessConfig =
  processConfigSchema.parse({
    interval: process.env.PROCESS_BATCHING_INTERVAL,
  });
