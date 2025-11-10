import { Notification } from "../../domain/types/Notification.js";

export type IncomingNotification = Omit<Notification, "id" | "createdAt">;
