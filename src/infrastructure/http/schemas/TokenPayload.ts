import z from "zod";

export const TokenPayload = z.object({
  sub: z.string().min(1),
  preferred_username: z.string().optional(),
  name: z.string().optional(),
});
