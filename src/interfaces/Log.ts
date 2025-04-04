import { EnvironmentType } from "src/enum/EnvironmentType";
import { LogLevel } from "src/enum/LogLevel";
import { TriggerType } from "src/enum/TriggerType";

interface LogMetadata {
  id: string;
  timestamp: Date;
}

interface ApplicationInfo {
  currentService: string;
}

interface ExecutionContext {
  callerService?: string;
  trigger: TriggerType;
  traceId?: string;
  correlation_id?: string;
  spanId?: string;
  environment?: EnvironmentType;
  host?: string;
}

export default interface Log
  extends LogMetadata,
    ExecutionContext,
    ApplicationInfo {
  level: LogLevel;
  message: string;
  eventType?: string;
  payload?: any;
  error?: Error;
  durationMs?: number;
}
