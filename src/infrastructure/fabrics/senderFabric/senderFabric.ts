import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";
import { createBitrixSender } from "../../senders/bitrixSender/bitrixSender.js";
import { createFallbackSender } from "../../senders/fallbackSender/fallbackSender.js";
import { createSmtpSender } from "../../senders/smtpSender/smtpSender.js";
import { SenderFabricConfig } from "./interfaces/SenderFabricConfig.js";

export const createDefaultSender = ({
  bitrixConfig,
  smtpConfig,
  onError = () => {},
  onHealthCheckError = () => {},
}: SenderFabricConfig): NotificationSender => {
  const senders = [
    createBitrixSender(bitrixConfig),
    createSmtpSender(smtpConfig),
  ];

  return createFallbackSender({ senders, onError, onHealthCheckError });
};
