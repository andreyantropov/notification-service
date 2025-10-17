import { z } from "zod";

export const EmailContactSchema = z.object({
  type: z.literal("email"),
  value: z.string().email(),
});
