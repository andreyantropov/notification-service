import { EventType } from "../telemetry/logging/enums/EventType.js";

export interface Log {
  message: string;
  eventType?: EventType;
  duration?: number;
  details?: unknown;
  error?: unknown;
}
