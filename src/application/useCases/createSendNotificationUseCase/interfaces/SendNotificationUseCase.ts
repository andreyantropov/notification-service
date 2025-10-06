import { Notification } from "../../../../domain/types/Notification.js";
import { RawNotification } from "../../../types/RawNotification.js";

export interface SendNotificationUseCase {
  send: (
    rawNotificatios: RawNotification | RawNotification[],
  ) => Promise<Notification[]>;
  checkHealth?: () => Promise<void>;
}
