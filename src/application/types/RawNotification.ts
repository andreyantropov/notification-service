import { Notification } from "../../domain/types/Notification.js";

export type RawNotification = Omit<Notification, "id">;
