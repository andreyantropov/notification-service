import { ContactsResolver } from "./interfaces/ContactsResolver";

export const bitrixContactResolver: ContactsResolver = (contacts) => {
  const contact = contacts?.bitrix;
  return contact ? { type: "bitrix", value: contact } : null;
};
