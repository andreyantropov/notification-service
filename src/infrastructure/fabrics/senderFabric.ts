import { NotificationSender } from "../../domain/interfaces/NotificationSender.js";
import { BitrixSenderConfig } from "../senders/bitrixSender/interfaces/BitrixSenderConfig.js";
import { SmtpSenderConfig } from "../senders/smtpSender/interfaces/SmtpSenderConfig.js";
import { createBitrixSender } from "../senders/bitrixSender/index.js";
import { createSmtpSender } from "../senders/smtpSender/index.js";
import { createFallbackSender } from "../senders/fallbackSender/index.js";
import { Recipient } from "../../domain/types/Recipient.js";

export const createDefaultSender = (
  bitrixConfig: BitrixSenderConfig,
  smtpConfig: SmtpSenderConfig,
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void,
): NotificationSender => {
  const senders = [
    createBitrixSender(bitrixConfig),
    createSmtpSender(smtpConfig),
  ];

  return createFallbackSender({ senders, onError });
};
