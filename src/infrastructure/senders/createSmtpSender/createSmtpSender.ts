import nodemailer from "nodemailer";
import { Sender } from "../../../domain/interfaces/Sender.js";
import {
  Recipient,
  isEmailRecipient,
} from "../../../domain/types/Recipient.js";
import { SmtpSenderConfig } from "./interfaces/SmtpSenderConfig.js";
import pTimeout from "p-timeout";

const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;

export const createSmtpSender = ({
  host,
  port,
  secure,
  auth,
  fromEmail,
}: SmtpSenderConfig): Sender => {
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
    isSupports,
    send,
    checkHealth,
  };
};
