import { ChannelTypes } from "./ChannelTypes.js";

interface ContactValueMap {
  email: string;
  bitrix: number;
}

export type Contact = {
  [K in ChannelTypes]: { type: K; value: ContactValueMap[K] };
}[ChannelTypes];

export function isContactOfType<T extends ChannelTypes>(
  contact: Contact,
  type: T,
): contact is Extract<Contact, { type: T }> {
  return contact.type === type;
}
