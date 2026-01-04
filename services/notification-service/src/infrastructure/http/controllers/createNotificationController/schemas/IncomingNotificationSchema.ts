import z from "zod";

import { DeliveryStrategy } from "@notification-platform/shared";

const BitrixContactSchema = z.object({
  type: z.literal("bitrix"),
  value: z.coerce.number().int().positive(),
});

const EmailContactSchema = z.object({
  type: z.literal("email"),
  value: z
    .string()
    .trim()
    .email()
    .min(8, "value (email адрес) должен быть не короче 8 символов")
    .max(256, "value (email адрес) не должен превышать 256 символов"),
});

const ContactSchema = z.discriminatedUnion("type", [
  EmailContactSchema,
  BitrixContactSchema,
]);

const NotificationStrategySchema = z.nativeEnum(DeliveryStrategy);

export const IncomingNotificationSchema = z.object({
  contacts: z
    .array(ContactSchema)
    .min(1, "Должен быть указан хотя бы один контакт")
    .max(100, "Количество контактов не должно превышать 100"),
  message: z
    .string()
    .trim()
    .min(1, "message не может быть пустым")
    .max(10_000, "message не должно превышать 10 000 символов"),
  isImmediate: z.coerce.boolean().optional(),
  strategy: NotificationStrategySchema.optional(),
});
