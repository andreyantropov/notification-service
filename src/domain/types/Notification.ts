import { type Contact } from "./Contact.js";
import { type Initiator } from "./Initiator.js";
import { type StrategyType } from "./StrategyType.js";

export interface Notification {
  readonly id: string;
  readonly createdAt: string;
  readonly contacts: readonly Contact[];
  readonly message: string;
  readonly strategy: StrategyType;
  readonly initiator: Initiator;
}
