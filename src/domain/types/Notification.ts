import { Contact } from "./Contact.js";
import { Subject } from "./Subject.js";

type NotificationStrategyLiteral =
  | "send_to_first_available"
  | "send_to_all_available";

export interface Notification {
  id: string;
  createdAt: string;
  contacts: Contact[];
  message: string;
  isImmediate?: boolean;
  strategy?: NotificationStrategyLiteral;
  subject?: Subject;
}
