import { type EventType, type TriggerType } from "../types/index.js";

export interface Log {
  readonly message: string;
  readonly eventName?: string;
  readonly eventType?: EventType;
  readonly trigger?: TriggerType;
  readonly durationMs?: number;
  readonly details?: unknown;
  readonly error?: unknown;
}
