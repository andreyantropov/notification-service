import { Recipient } from "../../../domain/types/Recipient";
import { ContactsResolver } from "./interfaces/ContactsResolver";
import { defaultContactResolverMap } from "./maps/contactResolverMap";
import { Notification } from "../../../domain/interfaces/Notification";
import { ResolveRecipients } from "./types/ResolveRecipients";

type ContactResolverMap = Record<string, ContactsResolver>;

export const resolveRecipients: ResolveRecipients = (
  notification: Notification,
  resolverMap: ContactResolverMap = defaultContactResolverMap,
): Recipient[] => {
  const contacts = notification.client.contacts ?? {};
  const resolved: Recipient[] = [];

  for (const key in resolverMap) {
    const resolver = resolverMap[key];
    const recipient = resolver(contacts);
    if (recipient) {
      resolved.push(recipient);
    }
  }

  return resolved;
};
