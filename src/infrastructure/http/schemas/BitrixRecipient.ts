import { z } from "zod";

export const BitrixRecipient = z.object({
  type: z.literal("bitrix"),
  value: z.number().int(),
});
