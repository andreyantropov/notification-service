import { Warning } from "./Warning.js";
import { Notification } from "../../../../domain/types/Notification.js";

export type SendResult = {
  success: boolean;
  notification: Notification;
  details?: unknown;
  error?: unknown;
  warnings?: Warning[];
};
