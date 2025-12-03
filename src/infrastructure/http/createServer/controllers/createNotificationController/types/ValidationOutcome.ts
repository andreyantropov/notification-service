import { IncomingNotification } from "../../../../../../application/types/IncomingNotification.js";

export type ValidationOutcome = {
  readonly valid: readonly IncomingNotification[];
  readonly invalid: readonly {
    readonly item: unknown;
    readonly error: unknown;
  }[];
};
