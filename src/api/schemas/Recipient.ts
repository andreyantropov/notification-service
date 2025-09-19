import { z } from "zod";

import { BitrixRecipient } from "./BitrixRecipient.js";
import { EmailRecipient } from "./EmailRecipient.js";

export const Recipient = z.discriminatedUnion("type", [
  EmailRecipient,
  BitrixRecipient,
]);
