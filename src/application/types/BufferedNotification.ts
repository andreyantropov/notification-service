import { Notification } from "../../domain/types/Notification.js";

export interface BufferedNotification {
  notification: Notification;
  otelContext: unknown;
}
