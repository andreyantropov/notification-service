import nodemailer from "nodemailer";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender";
import { Recipient, isEmailRecipient } from "../../../domain/types/Recipient";
import { SmtpSenderConfig } from "./interfaces/SmtpSenderConfig";

export const createSmtpSender = ({
  host,
  port,
  secure,
  auth,
  fromEmail,
}: SmtpSenderConfig): NotificationSender => {
  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: {
      user: auth.user,
      pass: auth.pass,
    },
  });

  const isSupports = (recipient: Recipient): boolean => {
    return recipient.type === "email";
  };

  const send = async (recipient: Recipient, message: string): Promise<void> => {
    if (!isEmailRecipient(recipient)) {
      throw new Error(
        `Неверный тип получателя: ожидается email, получено "${recipient.type}"`,
      );
    }

    try {
      await transporter.sendMail({
        from: `"ISPlanar" <${fromEmail}>`,
        to: recipient.value,
        subject: "ISPlanar",
        text: message,
      });
    } catch (error) {
      throw new Error(
        `Не удалось отправить email через SMTP: ${error.message}`,
        { cause: error },
      );
    }
  };

  return {
    isSupports,
    send,
  };
};
