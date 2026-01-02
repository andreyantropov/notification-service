import type { Notification, Subject } from "../../../../domain/types/index.js";
import type { IncomingNotification } from "../../../types/index.js";

export interface HandleIncomingNotificationsUseCase {
  readonly handle: (
    incomingNotifications: readonly IncomingNotification[],
    subject?: Subject,
  ) => Promise<Notification[]>;
}
