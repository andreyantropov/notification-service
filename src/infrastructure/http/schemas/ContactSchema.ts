import { z } from "zod";

import { BitrixContactSchema } from "./BitrixContactSchema.js";
import { EmailContactSchema } from "./EmailContactSchema.js";

export const ContactSchema = z.discriminatedUnion("type", [
  EmailContactSchema,
  BitrixContactSchema,
]);
