import z from "zod";

export const SubjectSchema = z.object({
  sub: z.string().min(1),
  preferred_username: z.string().optional(),
  name: z.string().optional(),
});
