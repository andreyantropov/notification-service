import { Notification } from "../../../../domain/interfaces/Notification.js";
import { Recipient } from "../../../../domain/types/Recipient.js";

export interface ContactsResolver {
  (contacts: Notification["client"]["contacts"]): Recipient | null;
}
