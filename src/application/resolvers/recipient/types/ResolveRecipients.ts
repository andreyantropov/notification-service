import { Notification } from "../../../../domain/interfaces/Notification";
import { Recipient } from "../../../../domain/types/Recipient";
import { ContactResolverMap } from "./ContactResolverMap";

export type ResolveRecipients = (
  notification: Notification,
  resolverMap?: ContactResolverMap,
) => Recipient[];
