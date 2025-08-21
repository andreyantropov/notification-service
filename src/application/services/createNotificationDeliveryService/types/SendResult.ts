import { Notification } from "../../../../domain/interfaces/Notification.js";

export type SendResult =
  | { success: true; notification: Notification }
  | { success: false; notification: Notification; error: unknown };
