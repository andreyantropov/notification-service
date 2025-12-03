import { DeliveryResult } from "./DeliveryResult.js";
import { Notification } from "../../../../domain/types/index.js";

export interface NotificationDeliveryService {
  readonly send: (
    notification: readonly Notification[],
  ) => Promise<DeliveryResult[]>;
  readonly checkHealth?: () => Promise<void>;
}
