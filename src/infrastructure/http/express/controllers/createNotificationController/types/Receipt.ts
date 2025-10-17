import { Notification } from "../../../../../../domain/types/Notification.js";

export type Receipt =
  | { success: true; notification: Notification }
  | {
      success: false;
      notification: unknown;
      error: unknown;
    };
