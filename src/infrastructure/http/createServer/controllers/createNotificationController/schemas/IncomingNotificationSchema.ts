import z from "zod";

const BitrixContactSchema = z.object({
  type: z.literal("bitrix"),
  value: z.number().int(),
});

const EmailContactSchema = z.object({
  type: z.literal("email"),
  value: z.string().email(),
});

const ContactSchema = z.discriminatedUnion("type", [
  EmailContactSchema,
  BitrixContactSchema,
]);

const NotificationStrategySchema = z.enum([
  "send_to_first_available",
  "send_to_all_available",
]);

export const IncomingNotificationSchema = z.object({
  contacts: z.array(ContactSchema),
  message: z.string().min(1, "Сообщение не может быть пустым"),
  isImmediate: z.boolean().optional(),
  strategy: NotificationStrategySchema.optional(),
});
