import { EventType } from "../enums/EventType";
import { LogLevel } from "../../../../shared/enums/LogLevel";

export interface RawLog {
  level: LogLevel;
  message: string;
  eventType: EventType;
  spanId: string;
  payload?: unknown;
  error?: unknown;
}
