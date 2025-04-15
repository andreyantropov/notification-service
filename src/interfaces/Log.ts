import { EnvironmentType } from "../enum/EnvironmentType";
import { LogLevel } from "../enum/LogLevel";
import { TriggerType } from "../enum/TriggerType";

export default interface Log {
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
  };
  fields: {
    id: string;
    message: string;
    traceId?: string;
    correlationId?: string;
    spanId?: string;
    durationMs: number;
    payload?: string;
    error?: string;
  };
}
