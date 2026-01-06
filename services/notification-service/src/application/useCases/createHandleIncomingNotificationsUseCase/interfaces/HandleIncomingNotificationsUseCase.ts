import type { Notification, Subject } from "@notification-platform/shared";
import type { IncomingNotification } from "../../../types/index.js";

export interface HandleIncomingNotificationsUseCase {
  readonly handle: (
    incomingNotifications: readonly IncomingNotification[],
    subject?: Subject,
  ) => Promise<Notification[]>;
}
