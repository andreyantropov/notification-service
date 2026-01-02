import type { Contact } from "./Contact.js";
import type { Subject } from "./Subject.js";
import { DeliveryStrategy } from "../enums/index.js";

export interface Notification {
  readonly id: string;
  readonly createdAt: string;
  readonly contacts: readonly Contact[];
  readonly message: string;
  readonly isImmediate?: boolean;
  readonly strategy?: DeliveryStrategy;
  readonly subject?: Subject;
}
