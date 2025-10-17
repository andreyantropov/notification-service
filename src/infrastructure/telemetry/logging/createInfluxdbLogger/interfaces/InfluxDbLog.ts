import { EnvironmentType } from "../../enums/EnvironmentType.js";
import { EventType } from "../../enums/EventType.js";
import { LogLevel } from "../../enums/LogLevel.js";
import { TriggerType } from "../../enums/TriggerType.js";

export interface InfluxDbLog {
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
