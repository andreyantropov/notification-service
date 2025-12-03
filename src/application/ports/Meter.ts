import { ChannelTypes } from "../../domain/types/ChannelTypes.js";
import { DeliveryStrategies } from "../../domain/types/DeliveryStrategies.js";

export interface Meter {
  readonly incrementTotalNotifications: () => void;
  readonly incrementNotificationsProcessedByResult: (
    result: "success" | "failure",
  ) => void;
  readonly incrementNotificationsProcessedBySubject: (
    subjectId: string,
  ) => void;
  readonly incrementNotificationsProcessedByStrategy: (
    strategy: DeliveryStrategies,
  ) => void;
  readonly incrementNotificationsByPriority: (isImmediate: boolean) => void;

  readonly recordChannelLatency: (
    latency: number,
    attributes: Record<string, string | boolean>,
  ) => void;
  readonly incrementNotificationsByChannel: (
    contactType: ChannelTypes,
    result: "success" | "failure",
  ) => void;
}
