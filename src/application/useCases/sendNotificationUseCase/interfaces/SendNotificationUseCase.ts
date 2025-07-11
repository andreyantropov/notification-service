import { Notification } from "../../../../domain/interfaces/Notification.js";

export interface SendNotificationUseCase {
  send: (notification: Notification) => Promise<void>;
}
