import { IncomingNotification } from "../../../../../../application/types/IncomingNotification.js";

export type ValidationOutcome = {
  valid: IncomingNotification[];
  invalid: { item: unknown; error: unknown }[];
};
