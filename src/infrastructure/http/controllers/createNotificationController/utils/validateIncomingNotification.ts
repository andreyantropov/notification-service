import z from "zod";

import { STRATEGY_TYPE } from "../../../../../domain/types/index.js";

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

const IncomingNotificationSchema = z.object({
  contacts: z
    .array(ContactSchema)
    .min(1, "Список контактов не должен быть пустым")
    .max(50, "Список контактов не должен превышать 50 штук"),
  message: z
    .string()
    .trim()
    .min(1, "message не может быть пустым")
    .max(10_000, "message не должно превышать 10 000 символов"),
  strategy: z.nativeEnum(STRATEGY_TYPE).optional(),
});

type IncomingNotification = z.infer<typeof IncomingNotificationSchema>;

export const validateIncomingNotification = (
  payload: unknown,
): z.SafeParseReturnType<
  z.input<typeof IncomingNotificationSchema>,
  IncomingNotification
> => {
  return IncomingNotificationSchema.safeParse(payload);
};
