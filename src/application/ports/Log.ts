import { EnvironmentType } from "../../shared/enums/EnvironmentType.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";
import { TriggerType } from "../../shared/enums/TriggerType.js";

export interface Log {
  measurement: string;
  timestamp: number;
  tags: {
    level: LogLevel;
    currentService: string;
    callerService?: string;
    trigger: TriggerType;
    environment?: EnvironmentType;
    eventType?: string;
    host?: string;
    traceId?: string;
    correlationId?: string;
    spanId?: string;
  };
  fields: {
    id: string;
    message: string;
    durationMs: number;
    payload?: string;
    error?: string;
  };
}
