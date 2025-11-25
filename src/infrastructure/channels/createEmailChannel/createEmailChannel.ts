import nodemailer from "nodemailer";
import pTimeout from "p-timeout";

import { EmailChannelConfig } from "./interfaces/EmailChannelConfig.js";
import { Channel } from "../../../domain/ports/Channel.js";
import { CHANNEL_TYPES } from "../../../domain/types/ChannelTypes.js";
import { Contact, isContactOfType } from "../../../domain/types/Contact.js";

const DEFAULT_GREETING_TIMEOUT = 5_000;
const DEFAULT_SEND_TIMEOUT = 10_000;
const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;

export const createEmailChannel = (config: EmailChannelConfig): Channel => {
  const { host, port, secure, auth, fromEmail } = config;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: auth.user,
      pass: auth.pass,
    },
    greetingTimeout: DEFAULT_GREETING_TIMEOUT,
    socketTimeout: DEFAULT_SEND_TIMEOUT,
  });

  const type = CHANNEL_TYPES.EMAIL;

  const isSupports = (contact: Contact): boolean => {
    return isContactOfType(contact, type);
  };

  const send = async (contact: Contact, message: string): Promise<void> => {
    if (!isContactOfType(contact, type)) {
      throw new Error(
        `Неверный тип получателя: ожидается email, получено "${contact.type}"`,
      );
    }

    try {
      await pTimeout(
        transporter.sendMail({
          from: `"ISPlanar" <${fromEmail}>`,
          to: contact.value,
          subject: "ISPlanar",
          text: message,
        }),
        {
          milliseconds: DEFAULT_SEND_TIMEOUT,
          message: `Превышено время ожидания ответа от SMTP-сервера при отправке email`,
        },
      );
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
