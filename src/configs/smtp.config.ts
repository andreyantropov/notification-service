import { SmtpSenderConfig } from "../infrastructure/senders/smtpSender/interfaces/SmtpSenderConfig";

export const smtpConfig: SmtpSenderConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD,
  },
  fromEmail: `"ISPlanar" <${process.env.SMTP_EMAIL}>`,
};
