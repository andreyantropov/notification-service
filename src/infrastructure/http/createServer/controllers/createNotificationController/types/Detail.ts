import type { Notification } from "../../../../../../domain/types/Notification.js";

export type Detail =
  | { readonly status: "success"; readonly notification: Notification }
  | {
      readonly status: "failure";
      readonly notification: unknown;
      readonly error: unknown;
    };
