import z from "zod";

import { NotificationStrategySchema } from "./NotificationStrategySchema.js";
import { Recipient } from "./Recipient.js";

export const SingleNotification = z.object({
  recipients: z.array(Recipient),
  message: z.string().min(1, "Сообщение не может быть пустым"),
  isUrgent: z.boolean().optional(),
  strategy: NotificationStrategySchema.optional(),
});
