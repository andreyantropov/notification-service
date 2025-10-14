import { z } from "zod";

export const EmailRecipient = z.object({
  type: z.literal("email"),
  value: z.string().email(),
});
