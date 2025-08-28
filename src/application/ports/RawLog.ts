import { EventType } from "../../shared/enums/EventType.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";

export interface RawLog {
  level: LogLevel;
  message: string;
  eventType: EventType;
  spanId: string;
  duration?: number;
  payload?: unknown;
  error?: unknown;
}
