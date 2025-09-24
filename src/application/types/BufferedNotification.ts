import { Context } from "@opentelemetry/api";

import { Notification } from "../../domain/types/Notification.js";

export interface BufferedNotification {
  notification: Notification;
  otelContext: Context;
}
