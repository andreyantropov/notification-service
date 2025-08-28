import { v4 } from "uuid";
import os from "os";
import { RawLog } from "../../../../application/ports/RawLog.js";
import { serializeError } from "serialize-error";
import { EnvironmentType } from "../../../../shared/enums/EnvironmentType.js";
import { TriggerType } from "../../../../shared/enums/TriggerType.js";
import { LoggerAdapter } from "../../../../application/ports/LoggerAdapter.js";
import { Logger } from "../../../../application/ports/Logger.js";
import { Log } from "../../../../application/ports/Log.js";

const MEASUREMENT = "isplanar_notification_logs";
const UNKNOWN_SERVICE = "unknown-service";

export const createLoggerAdapter = (logger: Logger): LoggerAdapter => {
  const formatLog = ({
    level,
    eventType,
    spanId,
    message,
    duration,
    payload,
    error,
  }: RawLog): Log => {
    const safeStringify = (data: unknown): string | undefined => {
      try {
        return typeof data === "string" ? data : JSON.stringify(data);
      } catch {
        return undefined;
      }
    };

    const processedError = error
      ? safeStringify(serializeError(error))
      : undefined;

    return {
      measurement: MEASUREMENT,
      timestamp: Date.now() * 1_000_000,
      tags: {
        level: level,
        currentService: process.env.CURRENT_SERVICE || UNKNOWN_SERVICE,
        callerService: process.env.CALLER_SERVICE || UNKNOWN_SERVICE,
        trigger:
          process.env.TRIGGER_TYPE === TriggerType.Cron
            ? TriggerType.Cron
            : TriggerType.Manual,
        environment:
          process.env.NODE_ENV === "development"
            ? EnvironmentType.Development
            : EnvironmentType.Production,
        eventType: eventType,
        host: os.hostname(),
        spanId: spanId,
      },
      fields: {
        id: v4(),
        message: message,
        durationMs: duration || 0,
        payload: safeStringify(payload),
        error: processedError,
      },
    };
  };

  const writeLog = async (rawLog: RawLog): Promise<void> => {
    try {
      const log = formatLog(rawLog);
      await logger.writeLog(log);
    } catch (error) {
      console.error("Не удалось записать лог в систему:", {
        originalLog: rawLog,
        loggingError: error,
      });
    }
  };

  return {
    writeLog,
  };
};
