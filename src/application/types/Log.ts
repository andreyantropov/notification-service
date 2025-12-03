import { EventType } from "../enums/index.js";

export interface Log {
  readonly message: string;
  readonly eventType?: EventType;
  readonly duration?: number;
  readonly details?: unknown;
  readonly error?: unknown;
}
