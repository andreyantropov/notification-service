import { type Initiator } from "../../../../domain/types/index.js";
import {
  type IncomingNotification,
  type NotificationResult,
} from "../../../types/index.js";

export interface ReceiveNotificationBatchUseCase {
  readonly execute: (
    incomingNotifications: readonly IncomingNotification[],
    initiator: Initiator,
  ) => Promise<NotificationResult[]>;
}
