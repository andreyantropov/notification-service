import { EventType } from "../enums/index.js";

export interface Log {
  message: string;
  eventType?: EventType;
  duration?: number;
  details?: unknown;
  error?: unknown;
}
