import { z } from "zod";

import { NotificationStrategySchema } from "./NotificationStrategySchema.js";
import { Recipient } from "./Recipient.js";

export const SuccessfulNotificationResponse = z.object({
  id: z.string(),
  recipients: z.array(Recipient),
  message: z.string(),
  isUrgent: z.boolean().optional(),
  strategy: NotificationStrategySchema.optional(),
});

const ZodIssue = z.object({
  code: z.string(),
  message: z.string(),
  path: z.array(z.union([z.string(), z.number()])),
  expected: z.string().optional(),
  received: z.string().optional(),
});

const FailedNotificationResponse = z.object({
  success: z.literal(false),
  notification: z.unknown(),
  error: z.array(ZodIssue),
});

const SuccessfulResult = z.object({
  success: z.literal(true),
  notification: SuccessfulNotificationResponse,
});

const SendResult = z.discriminatedUnion("success", [
  SuccessfulResult,
  FailedNotificationResponse,
]);

export const SendNotificationResponse = z.object({
  message: z.string(),
  totalCount: z.number().int().nonnegative(),
  validCount: z.number().int().nonnegative(),
  invalidCount: z.number().int().nonnegative(),
  details: z.array(SendResult),
});
