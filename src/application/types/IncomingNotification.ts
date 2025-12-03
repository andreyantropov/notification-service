import { Notification } from "../../domain/types/index.js";

export type IncomingNotification = Omit<Notification, "id" | "createdAt">;
