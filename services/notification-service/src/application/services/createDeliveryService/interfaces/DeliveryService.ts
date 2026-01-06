import type { Result } from "./Result.js";
import type { Notification } from "@notification-platform/shared";

export interface DeliveryService {
  readonly send: (notifications: readonly Notification[]) => Promise<Result[]>;
  readonly checkHealth?: () => Promise<void>;
}
