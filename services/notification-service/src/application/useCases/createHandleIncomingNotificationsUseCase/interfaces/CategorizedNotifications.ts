import type { Notification } from "@notification-platform/shared";

export interface CategorizedNotifications {
  readonly immediate: readonly Notification[];
  readonly nonImmediate: readonly Notification[];
}
