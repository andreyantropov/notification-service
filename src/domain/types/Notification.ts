import { Contact } from "./Contact.js";
import { DeliveryStrategies } from "./DeliveryStrategies.js";
import { Subject } from "./Subject.js";

export interface Notification {
  readonly id: string;
  readonly createdAt: string;
  readonly contacts: readonly Contact[];
  readonly message: string;
  readonly isImmediate?: boolean;
  readonly strategy?: DeliveryStrategies;
  readonly subject?: Subject;
}
