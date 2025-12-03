import { Warning } from "./Warning.js";
import { Notification } from "../../../../domain/types/index.js";

export type DeliveryResult = {
  readonly success: boolean;
  readonly notification: Notification;
  readonly details?: unknown;
  readonly error?: unknown;
  readonly warnings?: readonly Warning[];
};
