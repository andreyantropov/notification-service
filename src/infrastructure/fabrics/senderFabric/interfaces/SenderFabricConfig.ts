import { Recipient } from "../../../../domain/types/Recipient.js";
import { BitrixSenderConfig } from "../../../senders/bitrixSender/interfaces/BitrixSenderConfig.js";
import { SmtpSenderConfig } from "../../../senders/smtpSender/interfaces/SmtpSenderConfig.js";

export interface SenderFabricConfig {
  bitrixConfig: BitrixSenderConfig;
  smtpConfig: SmtpSenderConfig;
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void;
  onHealthCheckError?: (senderName: string, error: Error) => void;
}
