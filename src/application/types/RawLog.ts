import { EventType } from "../../shared/enums/EventType.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";

export interface RawLog {
  level: LogLevel;
  message: string;
  eventType: EventType;
  duration?: number;
  details?: unknown;
  error?: unknown;
}
