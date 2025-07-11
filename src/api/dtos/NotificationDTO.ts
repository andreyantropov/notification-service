import { z } from "zod";

export const EmailRecipient = z.object({
  type: z.literal("email"),
  value: z.string().email(),
});

export const BitrixRecipient = z.object({
  type: z.literal("bitrix"),
  value: z.number().int(),
});

export const Recipient = z.discriminatedUnion("type", [
  EmailRecipient,
  BitrixRecipient,
]);

export const NotificationRequest = z.object({
  recipients: z.array(Recipient),
  message: z.string(),
});
