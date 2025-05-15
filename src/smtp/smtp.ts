import "dotenv/config";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const mail = async (
  userEmail: string,
  message: string,
): Promise<SMTPTransport.SentMessageInfo> => {
  return await transporter.sendMail({
    from: `"ISPlanar" <${process.env.SMTP_EMAIL}>`,
    to: userEmail,
    subject: "ISPlanar",
    text: message,
  });
};
