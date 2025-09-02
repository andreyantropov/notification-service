import { Recipient } from "../types/Recipient.js";

export interface Sender {
  isSupports: (recipient: Recipient) => boolean;
  send: (recipient: Recipient, message: string) => Promise<void>;
  checkHealth?: () => Promise<void>;
}
