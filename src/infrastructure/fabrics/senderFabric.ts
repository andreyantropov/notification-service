import { NotificationSender } from "../../domain/interfaces/NotificationSender";
import { BitrixSenderConfig } from "../senders/bitrixSender/interfaces/BitrixSenderConfig";
import { SmtpSenderConfig } from "../senders/smtpSender/interfaces/SmtpSenderConfig";
import { createBitrixSender } from "../senders/bitrixSender";
import { createSmtpSender } from "../senders/smtpSender";
import { createFallbackSender } from "../senders/fallbackSender";
import { Recipient } from "../../domain/types/Recipient";

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
