import { z } from "zod";

export const BitrixContactSchema = z.object({
  type: z.literal("bitrix"),
  value: z.number().int(),
});
