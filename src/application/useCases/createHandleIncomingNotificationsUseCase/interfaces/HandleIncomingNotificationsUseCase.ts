import { Notification } from "../../../../domain/types/Notification.js";
import { IncomingNotification } from "../../../types/IncomingNotification.js";

export interface HandleIncomingNotificationsUseCase {
  handle: (
    incomingNotifications: IncomingNotification[],
  ) => Promise<Notification[]>;
}
