import type { Notification } from "../../../../domain/types/index.js";

export interface CategorizedNotifications {
  readonly immediate: readonly Notification[];
  readonly nonImmediate: readonly Notification[];
}
