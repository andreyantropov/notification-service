import z from "zod";
import { SingleNotification } from "../../../../../../api/schemas/NotificationRequest.js";

export type ParsedNotificationResult = {
  valid: z.infer<typeof SingleNotification>[];
  invalid: { item: unknown; error: z.ZodIssue[] }[];
};
