import { Recipient } from "../../../../domain/types/Recipient.js";

export interface Warning {
  message: string;
  details?: unknown;
  recipient?: Recipient;
  sender?: string;
}
