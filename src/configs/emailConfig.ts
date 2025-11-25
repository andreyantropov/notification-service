import { z } from "zod";

import { EmailChannelConfig } from "../infrastructure/channels/createEmailChannel/interfaces/EmailChannelConfig.js";

const emailConfigSchema = z.object({
  host: z.string().min(1, "host не может быть пустым"),
  port: z.coerce.number().int().positive().default(25),
  secure: z.boolean().default(false),
  auth: z.object({
    user: z.string().min(1, "user не может быть пустым"),
    pass: z.string().min(1, "pass не может быть пустым"),
  }),
  fromEmail: z.string().min(1, "fromEmail не может быть пустым"),
});

export const emailConfig: EmailChannelConfig = emailConfigSchema.parse({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD,
  },
  fromEmail: `"ISPlanar" <${process.env.SMTP_EMAIL}>`,
});
