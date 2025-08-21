import { z } from "zod";
import { Recipient } from "./Recipient.js";

const SingleNotification = z.object({
  recipients: z.array(Recipient),
  message: z.string().min(1),
});

export const NotificationRequest = z.union([
  SingleNotification,
  z.array(SingleNotification).min(1).max(100),
]);
