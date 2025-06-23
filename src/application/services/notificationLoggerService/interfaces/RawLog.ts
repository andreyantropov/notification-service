import { EventType } from "../enums/EventType.js";
import { LogLevel } from "../../../../shared/enums/LogLevel.js";

export interface RawLog {
  level: LogLevel;
  message: string;
  eventType: EventType;
  spanId: string;
  payload?: unknown;
  error?: unknown;
}
