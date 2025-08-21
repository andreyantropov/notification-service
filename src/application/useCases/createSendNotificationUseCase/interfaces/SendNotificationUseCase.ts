import { Notification } from "../../../../domain/interfaces/Notification.js";
import { NotificationBatchResult } from "./NotificationBatchResult.js";

export interface SendNotificationUseCase {
  send: (
    notification: Notification | Notification[],
  ) => Promise<NotificationBatchResult>;
  checkHealth?: () => Promise<void>;
}
