import { Recipient } from "../types/Recipient.js";

export interface Sender {
  type: "bitrix" | "email";
  isSupports: (recipient: Recipient) => boolean;
  send: (recipient: Recipient, message: string) => Promise<void>;
  checkHealth?: () => Promise<void>;
}
