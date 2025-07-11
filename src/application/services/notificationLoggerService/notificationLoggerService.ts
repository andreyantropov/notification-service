import { EnvironmentType } from "../../../shared/enums/EnvironmentType.js";
import { TriggerType } from "../../../shared/enums/TriggerType.js";
import { Log } from "../../../shared/interfaces/Log.js";
import { v4 } from "uuid";
import os from "os";
import { NotificationLoggerService } from "./interfaces/NotificationLoggerService.js";
import { NotificationLoggerServiceConfig } from "./interfaces/NotificationLoggerServiceConfig.js";
import { RawLog } from "./interfaces/RawLog.js";
import { serializeError } from "serialize-error";

const MEASUREMENT = "isplanar_notification_logs";
const UNKNOWN_SERVICE = "unknown-service";

export const createNotificationLoggerService = ({
  logger,
}: NotificationLoggerServiceConfig): NotificationLoggerService => {
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
