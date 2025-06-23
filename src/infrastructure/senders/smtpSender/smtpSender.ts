import nodemailer from "nodemailer";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";
import {
  Recipient,
  isEmailRecipient,
} from "../../../domain/types/Recipient.js";
import { SmtpSenderConfig } from "./interfaces/SmtpSenderConfig.js";

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
      throw new Error(`Не удалось отправить email через SMTP`, {
        cause: error,
      });
    }
  };

  return {
    isSupports,
    send,
  };
};
