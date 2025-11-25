import { ChannelTypes } from "../../domain/types/ChannelTypes.js";
import { DeliveryStrategies } from "../../domain/types/DeliveryStrategies.js";

export interface Meter {
  incrementTotalNotifications: () => void;
  incrementNotificationsProcessedByResult: (
    result: "success" | "failure",
  ) => void;
  incrementNotificationsProcessedBySubject: (subjectId: string) => void;
  incrementNotificationsProcessedByStrategy: (
    strategy: DeliveryStrategies,
  ) => void;
  incrementNotificationsByPriority: (isImmediate: boolean) => void;

  recordChannelLatency: (
    latency: number,
    attributes: Record<string, string | boolean>,
  ) => void;
  incrementNotificationsByChannel: (
    contactType: ChannelTypes,
    result: "success" | "failure",
  ) => void;
}
