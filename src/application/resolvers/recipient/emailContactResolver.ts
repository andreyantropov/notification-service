import { ContactsResolver } from "./interfaces/ContactsResolver.js";

export const emailContactResolver: ContactsResolver = (contacts) => {
  const contact = contacts?.email;
  return contact ? { type: "email", value: contact } : null;
};
