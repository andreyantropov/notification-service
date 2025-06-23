import { Notification } from "../../../../domain/interfaces/Notification.js";
import { Recipient } from "../../../../domain/types/Recipient.js";
import { ContactResolverMap } from "./ContactResolverMap.js";

export type ResolveRecipients = (
  notification: Notification,
  resolverMap?: ContactResolverMap,
) => Recipient[];
