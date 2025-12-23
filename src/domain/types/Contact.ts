import type { ChannelType } from "./ChannelType.js";

interface ContactValueMap {
  readonly email: string;
  readonly bitrix: number;
}

export type Contact = {
  [K in ChannelType]: { readonly type: K; readonly value: ContactValueMap[K] };
}[ChannelType];

export const isContactOfType = <T extends ChannelType>(
  contact: Contact,
  type: T,
): contact is Extract<Contact, { type: T }> => {
  return contact.type === type;
};
