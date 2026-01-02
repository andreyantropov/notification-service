import type { Result } from "./Result.js";
import type { Notification } from "../../../../domain/types/index.js";

export interface DeliveryService {
  readonly send: (notifications: readonly Notification[]) => Promise<Result[]>;
  readonly checkHealth?: () => Promise<void>;
}
