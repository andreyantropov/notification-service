import nodemailer from "nodemailer";

import { type Channel } from "../../../domain/ports/index.js";
import {
  CHANNEL_TYPE,
  type Contact,
  isContactOfType,
} from "../../../domain/types/index.js";

import { type EmailChannelConfig } from "./interfaces/index.js";

export const createEmailChannel = (config: EmailChannelConfig): Channel => {
  const {
    host,
    port,
    secure,
    auth,
    fromEmail,
    subject,
    greetingTimeoutMs,
    socketTimeoutMs,
  } = config;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    greetingTimeout: greetingTimeoutMs,
    socketTimeout: socketTimeoutMs,
  });

  const type = CHANNEL_TYPE.EMAIL;

  const isSupports = (
    contact: Contact,
  ): contact is Extract<Contact, { type: typeof CHANNEL_TYPE.EMAIL }> => {
    return isContactOfType(contact, type);
  };

  const send = async (contact: Contact, message: string): Promise<void> => {
    if (!isSupports(contact)) {
      throw new Error(
        `Неверный тип получателя: ожидается email, получено "${contact.type}"`,
      );
    }

    try {
      await transporter.sendMail({
        from: fromEmail,
        to: contact.value,
        subject,
        text: message,
      });
    } catch (error) {
      throw new Error(`Не удалось отправить уведомления через SMTP`, {
        cause: error,
      });
    }
  };

  const checkHealth = async (): Promise<void> => {
    try {
      await transporter.verify();
    } catch (error) {
      throw new Error(`SMTP сервер недоступен`, {
        cause: error,
      });
    }
  };

  return {
    type,
    isSupports,
    send,
    checkHealth,
  };
};
