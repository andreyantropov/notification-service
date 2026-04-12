import { type Notification } from "../../../../domain/types/index.js";

export interface DeliveryService {
  readonly deliver: (notifications: Notification) => Promise<void>;
}
