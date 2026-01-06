import { EventType } from "@notification-platform/shared";

export interface Log {
  readonly logLevel: "error" | "warning" | "info";
  readonly message: string;
  readonly eventType: EventType;
  readonly durationMs: number;
  details: {
    readonly notificationsCount: number;
    readonly failedIds?: readonly string[];
    readonly failedCount?: number;
    readonly warningIds?: readonly string[];
    readonly warningCount?: number;
    readonly successfulIds?: readonly string[];
    readonly successfulCount?: number;
  };
}
