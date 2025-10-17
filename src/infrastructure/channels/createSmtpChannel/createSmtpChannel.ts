import nodemailer from "nodemailer";
import pTimeout from "p-timeout";

import { SmtpChannelConfig } from "./interfaces/SmtpChannelConfig.js";
import { Channel } from "../../../domain/ports/Channel.js";
import { Contact, isEmailContact } from "../../../domain/types/Contact.js";

const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;

export const createSmtpChannel = (config: SmtpChannelConfig): Channel => {
  const { host, port, secure, auth, fromEmail } = config;

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure,
    auth: {
      user: auth.user,
      pass: auth.pass,
    },
  });

  const type = "email";

  const isSupports = (contact: Contact): boolean => {
    return contact.type === type;
  };

  const send = async (contact: Contact, message: string): Promise<void> => {
    if (!isEmailContact(contact)) {
      throw new Error(
        `Неверный тип получателя: ожидается email, получено "${contact.type}"`,
      );
    }

    try {
      await transporter.sendMail({
        from: `"ISPlanar" <${fromEmail}>`,
        to: contact.value,
        subject: "ISPlanar",
        text: message,
      });
    } catch (error) {
      throw new Error(`Не удалось отправить email через SMTP`, {
        cause: error,
      });
    }
  };

  const checkHealth = async (): Promise<void> => {
    try {
      await pTimeout(
        new Promise<void>((resolve, reject) => {
          transporter.verify((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        }),
        {
          milliseconds: DEFAULT_HEALTHCHECK_TIMEOUT,
          message: "Превышено время ожидания подключения к SMTP",
        },
      );
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
