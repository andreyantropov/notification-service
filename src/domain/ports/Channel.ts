import { ChannelTypes } from "../types/ChannelTypes.js";
import { Contact } from "../types/Contact.js";

export interface Channel {
  readonly type: ChannelTypes;
  readonly isSupports: (contact: Contact) => boolean;
  readonly send: (contact: Contact, message: string) => Promise<void>;
  readonly checkHealth?: () => Promise<void>;
}
