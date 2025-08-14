import { z } from "zod";
import { Recipient } from "./Recipient.js";

export const NotificationRequest = z.object({
  recipients: z.array(Recipient),
  message: z.string(),
});
