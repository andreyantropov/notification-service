import z from "zod";

const BatchLimitSchema = z
  .array(z.any())
  .min(1, "Список уведомлений не должен быть пустым")
  .max(50, "Список уведомлений не должен превышать 50 штук");

type BatchLimit = z.infer<typeof BatchLimitSchema>;

export const validateBatchLimit = (
  payload: unknown,
): z.SafeParseReturnType<z.input<typeof BatchLimitSchema>, BatchLimit> => {
  return BatchLimitSchema.safeParse(payload);
};
