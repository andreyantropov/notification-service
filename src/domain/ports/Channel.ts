import { ChannelTypes } from "../types/ChannelTypes.js";
import { Contact } from "../types/Contact.js";

export interface Channel {
  type: ChannelTypes;
  isSupports: (contact: Contact) => boolean;
  send: (contact: Contact, message: string) => Promise<void>;
  checkHealth?: () => Promise<void>;
}
