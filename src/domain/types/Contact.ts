import { ChannelTypes } from "./ChannelTypes.js";

interface ContactValueMap {
  readonly email: string;
  readonly bitrix: number;
}

export type Contact = {
  [K in ChannelTypes]: { readonly type: K; readonly value: ContactValueMap[K] };
}[ChannelTypes];

export function isContactOfType<T extends ChannelTypes>(
  contact: Contact,
  type: T,
): contact is Extract<Contact, { type: T }> {
  return contact.type === type;
}
