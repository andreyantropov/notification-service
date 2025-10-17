import { z } from "zod";

import { SchedulerConfig } from "../infrastructure/schedulers/createScheduler/index.js";

const taskManagerConfigSchema = z.object({
  interval: z.coerce.number().int().positive().default(60_000),
});

export const taskManagerConfig: SchedulerConfig = taskManagerConfigSchema.parse(
  {
    interval: process.env.PROCESS_BATCHING_INTERVAL,
  },
);
