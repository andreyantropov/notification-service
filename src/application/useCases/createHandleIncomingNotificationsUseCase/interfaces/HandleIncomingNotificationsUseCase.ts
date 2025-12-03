import { Notification } from "../../../../domain/types/index.js";
import { IncomingNotification } from "../../../types/index.js";

export interface HandleIncomingNotificationsUseCase {
  readonly handle: (
    incomingNotifications: readonly IncomingNotification[],
  ) => Promise<Notification[]>;
}
