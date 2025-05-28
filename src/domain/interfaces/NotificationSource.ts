import { Notification } from "./Notification";

export interface NotificationSource {
  getNotifications: () => Promise<Notification[]>;
  deleteNotification: (id: number) => Promise<number>;
}
