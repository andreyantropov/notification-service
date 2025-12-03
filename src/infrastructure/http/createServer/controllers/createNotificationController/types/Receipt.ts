import { Notification } from "../../../../../../domain/types/Notification.js";

export type Receipt =
  | { readonly success: true; readonly notification: Notification }
  | {
      readonly success: false;
      readonly notification: unknown;
      readonly error: unknown;
    };
