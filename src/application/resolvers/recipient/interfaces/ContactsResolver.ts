import { Notification } from "../../../../domain/interfaces/Notification";
import { Recipient } from "../../../../domain/types/Recipient";

export interface ContactsResolver {
  (contacts: Notification["client"]["contacts"]): Recipient | null;
}
