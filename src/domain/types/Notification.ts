import { Contact } from "./Contact.js";
import { DeliveryStrategies } from "./DeliveryStrategies.js";
import { Subject } from "./Subject.js";

export interface Notification {
  id: string;
  createdAt: string;
  contacts: Contact[];
  message: string;
  isImmediate?: boolean;
  strategy?: DeliveryStrategies;
  subject?: Subject;
}
