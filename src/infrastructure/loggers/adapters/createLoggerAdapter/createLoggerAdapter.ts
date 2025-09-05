import { v4 } from "uuid";
import os from "os";
import { RawLog } from "../../../../application/types/RawLog.js";
import { serializeError } from "serialize-error";
import { LoggerAdapter } from "../../../../application/ports/LoggerAdapter.js";
import { Logger } from "../../../ports/Logger.js";
import { Log } from "../../../types/Log.js";
import { LoggerAdapterConfig } from "./interfaces/LoggerAdapterConfig.js";
import { TriggerType } from "../../../../shared/enums/TriggerType.js";

export const createLoggerAdapter = (
  logger: Logger,
  { measurement, currentService, environment }: LoggerAdapterConfig,
): LoggerAdapter => {
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
      measurement: measurement,
      timestamp: Date.now() * 1_000_000,
      tags: {
        level: level,
        currentService,
        trigger: TriggerType.Api,
        environment,
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
