import { Recipient } from "../types/Recipient.js";
import { SenderTypeLiteral } from "../types/SenderTypeLiteral.js";

export interface Sender {
  type: SenderTypeLiteral;
  isSupports: (recipient: Recipient) => boolean;
  send: (recipient: Recipient, message: string) => Promise<void>;
  checkHealth?: () => Promise<void>;
}
