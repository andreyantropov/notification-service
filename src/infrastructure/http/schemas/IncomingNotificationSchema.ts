import z from "zod";

import { ContactSchema } from "./ContactSchema.js";
import { NotificationStrategySchema } from "./NotificationStrategySchema.js";

export const IncomingNotificationSchema = z.object({
  contacts: z.array(ContactSchema),
  message: z.string().min(1, "Сообщение не может быть пустым"),
  isImmediate: z.boolean().optional(),
  strategy: NotificationStrategySchema.optional(),
});
