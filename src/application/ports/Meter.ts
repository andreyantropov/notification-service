export interface Meter {
  incrementTotalNotifications: () => void;
  incrementNotificationsProcessedByResult: (
    result: "success" | "failure",
  ) => void;
  incrementNotificationsProcessedBySubject: (subjectId: string) => void;
  incrementNotificationsProcessedByStrategy: (strategy: string) => void;
  incrementNotificationsByPriority: (isImmediate: boolean) => void;

  recordChannelLatency: (
    latency: number,
    attributes: Record<string, string | boolean>,
  ) => void;
  incrementNotificationsByChannel: (
    contactType: string,
    result: "success" | "failure",
  ) => void;
}
