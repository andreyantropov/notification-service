import type { DeliveryStrategy } from "../../domain/enums/index.js";
import type { ChannelType } from "../../domain/types/ChannelType.js";

export interface Meter {
  readonly incrementNotificationsProcessedTotal: () => void;
  readonly incrementNotificationsProcessedByResult: (
    status: "success" | "failure",
  ) => void;
  readonly incrementNotificationsProcessedBySubject: (
    subjectId: string,
  ) => void;
  readonly incrementNotificationsProcessedByStrategy: (
    strategy: DeliveryStrategy,
  ) => void;
  readonly incrementNotificationsProcessedByPriority: (
    isImmediate: boolean,
  ) => void;
  readonly incrementRetryRoutingByQueue: (queue: string) => void;

  readonly recordChannelLatency: (
    latency: number,
    attributes: Record<string, string | boolean>,
  ) => void;
  readonly incrementNotificationsProcessedByChannel: (
    channel: ChannelType,
    status: "success" | "failure",
  ) => void;
}
