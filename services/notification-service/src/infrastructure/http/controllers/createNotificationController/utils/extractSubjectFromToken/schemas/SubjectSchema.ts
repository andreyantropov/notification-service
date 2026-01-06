import z from "zod";

export const SubjectSchema = z.object({
  sub: z
    .string()
    .trim()
    .min(1, "sub не должен быть пустым")
    .max(256, "sub не должен превышать 256 символов"),
  preferred_username: z
    .string()
    .trim()
    .min(2, "preferred_username должен содержать минимум 2 символа")
    .max(256, "preferred_username не должен превышать 256 символов")
    .optional(),
  name: z
    .string()
    .trim()
    .min(2, "name должен содержать минимум 2 символа")
    .max(512, "name не должен превышать 512 символов")
    .optional(),
});
