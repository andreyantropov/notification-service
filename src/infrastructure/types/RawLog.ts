import { EventType } from "../../shared/enums/EventType.js";

export interface RawLog {
  message: string;
  eventType?: EventType;
  duration?: number;
  details?: unknown;
  error?: unknown;
}
