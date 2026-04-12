import {
  type Initiator,
  type Notification,
} from "../../../../domain/types/index.js";
import { type IncomingNotification } from "../../../types/index.js";

export interface ReceiveNotificationUseCase {
  readonly execute: (
    incomingNotification: IncomingNotification,
    initiator: Initiator,
  ) => Promise<Notification>;
}
