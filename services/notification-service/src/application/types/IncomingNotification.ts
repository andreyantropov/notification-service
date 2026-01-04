import type { Notification } from "@notification-platform/shared";

export type IncomingNotification = Omit<
  Notification,
  "id" | "createdAt" | "subject"
>;
