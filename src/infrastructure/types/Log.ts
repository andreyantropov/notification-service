import { EnvironmentType } from "../../shared/enums/EnvironmentType.js";
import { EventType } from "../../shared/enums/EventType.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";
import { TriggerType } from "../../shared/enums/TriggerType.js";

export interface Log {
  measurement: string;
  timestamp: number;
  tags: {
    level: LogLevel;
    serviceName?: string;
    serviceVersion?: string;
    trigger?: TriggerType;
    environment?: EnvironmentType;
    eventType?: EventType;
    host?: string;
  };
  fields: {
    id: string;
    message: string;
    durationMs?: number;
    traceId?: string;
    spanId?: string;
    details?: string;
    error?: string;
  };
}
