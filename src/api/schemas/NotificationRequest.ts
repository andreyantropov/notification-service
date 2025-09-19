import { z } from "zod";

import { Recipient } from "./Recipient.js";

export const SingleNotification = z.object({
  recipients: z.array(Recipient),
  message: z.string().min(1),
  isUrgent: z.boolean().optional(),
});

export const NotificationRequest = z.union([
  SingleNotification,
  z.array(SingleNotification).min(1).max(100),
]);
