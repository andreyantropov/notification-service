import { Contact } from "../types/Contact.js";

type ChannelTypeLiteral = "bitrix" | "email";

export interface Channel {
  type: ChannelTypeLiteral;
  isSupports: (contact: Contact) => boolean;
  send: (contact: Contact, message: string) => Promise<void>;
  checkHealth?: () => Promise<void>;
}
