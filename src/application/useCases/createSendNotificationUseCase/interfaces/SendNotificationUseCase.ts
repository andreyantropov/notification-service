import { Notification } from "../../domain/types/Notification.js";

export interface SendNotificationUseCase {
  send: (notification: Notification | Notification[]) => Promise<void>;
  checkHealth?: () => Promise<void>;
}
