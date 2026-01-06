import type { Warning } from "./Warning.js";
import type { Notification } from "@notification-platform/shared";

export type Result = {
  readonly status: "success" | "failure";
  readonly notification: Notification;
  readonly details?: unknown;
  readonly error?: unknown;
  readonly warnings?: readonly Warning[];
};
