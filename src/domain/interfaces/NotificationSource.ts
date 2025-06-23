import { Notification } from "./Notification.js";

export interface NotificationSource {
  getNotifications: () => Promise<Notification[]>;
  deleteNotification: (id: number) => Promise<number>;
}
