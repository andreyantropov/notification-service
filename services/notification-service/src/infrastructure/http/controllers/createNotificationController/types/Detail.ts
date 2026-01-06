import type { Notification } from "@notification-platform/shared";

export type Detail =
  | { readonly status: "success"; readonly notification: Notification }
  | {
    readonly status: "failure";
    readonly notification: unknown;
    readonly error: unknown;
  };
