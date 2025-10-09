import { z } from "zod";

export const NotificationStrategySchema = z.enum([
  "send_to_first_available",
  "send_to_all_available",
]);

export type NotificationStrategy = z.infer<typeof NotificationStrategySchema>;
