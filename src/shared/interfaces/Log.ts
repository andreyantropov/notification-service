import { EnvironmentType } from "../enums/EnvironmentType";
import { LogLevel } from "../enums/LogLevel";
import { TriggerType } from "../enums/TriggerType";

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
