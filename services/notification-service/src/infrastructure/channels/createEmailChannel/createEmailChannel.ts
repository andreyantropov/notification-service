import nodemailer from "nodemailer";
import pTimeout from "p-timeout";

import {
  DEFAULT_GREETING_TIMEOUT_MS,
  DEFAULT_SEND_TIMEOUT_MS,
  DEFAULT_HEALTHCHECK_TIMEOUT_MS,
} from "./constants/index.js";
import type { EmailChannelConfig } from "./interfaces/index.js";
import { CHANNEL_TYPES, isContactOfType } from "@notification-platform/shared";
import type { Channel } from "../../../domain/ports/index.js";
import type { Contact } from "@notification-platform/shared";

export const createEmailChannel = (config: EmailChannelConfig): Channel => {
  const {
    host,
    port,
    secure,
    auth,
    fromEmail,
    greetingTimeoutMs = DEFAULT_GREETING_TIMEOUT_MS,
    sendTimeoutMs = DEFAULT_SEND_TIMEOUT_MS,
    healthcheckTimeoutMs = DEFAULT_HEALTHCHECK_TIMEOUT_MS,
  } = config;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    greetingTimeout: greetingTimeoutMs,
    socketTimeout: sendTimeoutMs,
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
          from: fromEmail,
          to: contact.value,
          subject: "ISPlanar",
          text: message,
        }),
        {
          milliseconds: sendTimeoutMs,
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
          milliseconds: healthcheckTimeoutMs,
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
