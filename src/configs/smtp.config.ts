import { z } from "zod";
import { SmtpSenderConfig } from "../infrastructure/senders/smtpSender/interfaces/SmtpSenderConfig";

const smtpConfigSchema = z.object({
  host: z.string().min(1, "SMTP_HOST обязателен").default("localhost"),
  port: z.coerce.number().int().positive().default(25),
  secure: z.boolean().default(false),
  auth: z.object({
    user: z.string().min(1, "SMTP_LOGIN обязателен"),
    pass: z.string().min(1, "SMTP_PASSWORD обязателен"),
  }),
  fromEmail: z
    .string()
    .min(1, "Необходимо указать адрес отправителя SMTP_EMAIL"),
});

export const smtpConfig: SmtpSenderConfig = smtpConfigSchema.parse({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD,
  },
  fromEmail: `"ISPlanar" <${process.env.SMTP_EMAIL}>`,
});
